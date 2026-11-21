import { GameObjects, type Scene } from 'phaser';
import { batteryLevel } from '../../engine/metrics';
import type { InstructionOrigin, PlacedTool } from '../../engine/tools';
import type { SimEvent, Snapshot, ThreadDef } from '../../engine/types';
import type { LevelDefinition } from '../../levels/types';
import { robotFrameFor } from '../assetManifest';
import type { LineLayout, Rect } from '../layouts/types';
import {
  lineAnchorX,
  lineCheckpointLabel,
  lineGates,
  lineRobotX,
  type LineGate,
} from '../lineSpots';
import { robotDetail, statusLabel } from '../robotLabel';
import {
  COLORS,
  DEPTH,
  DESK,
  DOOR_STYLE,
  HALL,
  LINE,
  STATE_STYLE,
  TEXT_STYLE,
} from '../theme';
import { BatteryMeter } from '../views/BatteryMeter';
import { LineRobotView } from '../views/LineRobotView';

const GATE_OFFSET = { mutex: -6, semaphore: 6 } as const;

interface LaneCard {
  threadId: string;
  totalRounds: number;
  frame: GameObjects.Rectangle;
  text: GameObjects.Text;
}

interface GateBar {
  gate: LineGate;
  bar: GameObjects.Rectangle;
}

/**
 * Arena lini lurus Level 1-5 (T-094, tahap 2). Tiga lajur berbagi posisi x;
 * gerbang alat berupa batang tegak yang memotong semua lajur. Semua nilai
 * dibaca dari snapshot; aturan permainan tetap di engine/controller.
 * Belum terdaftar di LevelScene secara default.
 */
export class LineArena {
  private readonly objects: GameObjects.GameObject[] = [];
  private readonly robots: LineRobotView[] = [];
  private readonly cards: LaneCard[] = [];
  private readonly xs = new Map<string, number[]>();
  private readonly gateBars: GateBar[] = [];
  private readonly mutexPanel: GameObjects.Rectangle;
  private readonly mutexText: GameObjects.Text;
  private readonly areaPanel: GameObjects.Rectangle;
  private readonly areaText: GameObjects.Text;
  private readonly boardText: GameObjects.Text;
  private readonly lamp: GameObjects.Arc;
  private readonly lampText: GameObjects.Text;
  private readonly packerText: GameObjects.Text;
  private readonly battery: BatteryMeter;
  private readonly capacity: number;
  private signaled = false;

  constructor(
    scene: Scene,
    private readonly layout: LineLayout,
    level: LevelDefinition,
    snapshot: Readonly<Snapshot>,
    effective: readonly ThreadDef[],
    origins: Readonly<Record<string, readonly InstructionOrigin[]>>,
    tools: readonly PlacedTool[],
    private readonly durationMs = 0,
  ) {
    const bandTop = Math.min(...layout.lanes.map((l) => l.y)) - LINE.laneHalf;
    const bandBottom =
      Math.max(...layout.lanes.map((l) => l.y)) + LINE.laneHalf;
    const bandHeight = bandBottom - bandTop;
    const bandCenter = bandTop + bandHeight / 2;
    this.capacity = level.areas?.[layout.hall.id] ?? 0;

    this.rect(scene, layout.hall.zone, HALL.dropReady, 0.06, DEPTH.floor + 1);
    this.rect(scene, layout.storage, HALL.zoneFill, HALL.zoneFillAlpha, DEPTH.track);
    this.text(
      scene,
      layout.storage.x + layout.storage.width / 2,
      layout.storage.y + layout.storage.height / 2,
      `Penyimpanan\nTarget: ${level.goal.target.value}`,
    );

    // Lajur, checkpoint (dari program tiap robot), kartu lajur.
    layout.lanes.forEach((lane, index) => {
      const def = level.threads.find((t) => t.id === lane.threadId);
      const left = layout.slotX[0] ?? 0;
      const right = layout.slotX[layout.slotX.length - 1] ?? 0;
      this.track(
        scene.add
          .rectangle(
            (left + right) / 2,
            lane.y,
            right - left + LINE.checkpointRadius * 2,
            LINE.laneHalf * 2,
            ROAD_COLOR,
          )
          .setStrokeStyle(2, ROAD_EDGE)
          .setDepth(DEPTH.track),
      );
      def?.program.forEach((instruction, i) => {
        const x = layout.checkpointX[i];
        if (x === undefined) return;
        this.track(
          scene.add
            .circle(x, lane.y, LINE.checkpointRadius, CHECKPOINT_FILL)
            .setStrokeStyle(2, CHECKPOINT_STROKE)
            .setDepth(DEPTH.slot),
        );
        this.text(scene, x, lane.y, lineCheckpointLabel(instruction), 9);
      });
      const frame = this.rect(scene, lane.label, HALL.zoneFill, 0.8, DEPTH.slot);
      const text = this.text(scene, lane.label.x + 6, lane.label.y + 4, '', 10)
        .setOrigin(0, 0)
        .setWordWrapWidth(lane.label.width - 10);
      this.cards.push({
        threadId: lane.threadId,
        totalRounds: def?.repeat ?? 1,
        frame,
        text,
      });

      const effectiveProgram = effective.find((t) => t.id === lane.threadId);
      const laneOrigins = origins[lane.threadId] ?? [];
      void effectiveProgram;
      this.xs.set(lane.threadId, lineAnchorX(laneOrigins, layout));
      const thread = snapshot.threads[index];
      this.robots.push(
        new LineRobotView(scene, thread ?? snapshot.threads[0]!, {
          x: lineRobotX(thread?.pc ?? 0, this.xs.get(lane.threadId) ?? []),
          y: lane.y,
          spriteFrame: robotFrameFor(index),
        }),
      );
    });

    // Gerbang: dibaca dari robot pertama (alat berlaku untuk semua).
    const first = effective[0];
    const firstOrigins = first ? (origins[first.id] ?? []) : [];
    const gates = first ? lineGates(first.program, firstOrigins, layout) : [];
    for (const kind of ['mutex', 'semaphore'] as const) {
      const entry = gates.find((g) => g.kind === kind && g.role === 'entry');
      const exit = gates.find((g) => g.kind === kind && g.role === 'exit');
      if (entry === undefined || exit === undefined) continue;
      const mid = (entry.x + exit.x) / 2 + GATE_OFFSET[kind];
      this.track(
        scene.add
          .rectangle(mid, bandCenter, exit.x - entry.x, bandHeight, 0xffffff, 0.08)
          .setDepth(DEPTH.segment),
      );
      for (const gate of [entry, exit]) {
        const bar = this.track(
          scene.add
            .rectangle(gate.x + GATE_OFFSET[kind], bandCenter, 6, bandHeight, DOOR_STYLE.free.color)
            .setDepth(DEPTH.gate),
        );
        this.gateBars.push({ gate, bar });
      }
    }

    // Papan Stok dan tautan READ/WRITE.
    const board = layout.board;
    this.rect(scene, board, BOARD_FILL, 1, DEPTH.slot).setStrokeStyle(3, CHECKPOINT_STROKE);
    this.boardText = this.text(scene, board.x + board.width / 2, board.y + board.height / 2, '', 20);
    for (const link of layout.boardLinks) {
      const x = layout.checkpointX[link.checkpoint];
      if (x === undefined) continue;
      this.track(
        scene.add
          .rectangle(x, (bandBottom + board.y) / 2, 3, board.y - bandBottom, BOARD_LINK, 0.7)
          .setDepth(DEPTH.track),
      );
      this.text(scene, x + 22, bandBottom + 10, link.direction === 'read' ? 'baca' : 'tulis', 10);
    }

    // Panel status mutex dan aula.
    this.mutexPanel = this.rect(scene, layout.mutexPanel, COLORS.tile, 1, DEPTH.slot);
    this.mutexText = this.text(
      scene,
      layout.mutexPanel.x + layout.mutexPanel.width / 2,
      layout.mutexPanel.y + layout.mutexPanel.height / 2,
      '',
      11,
    ).setWordWrapWidth(layout.mutexPanel.width - 10);
    this.areaPanel = this.rect(scene, layout.areaPanel, COLORS.tile, 1, DEPTH.slot);
    this.areaText = this.text(
      scene,
      layout.areaPanel.x + layout.areaPanel.width / 2,
      layout.areaPanel.y + layout.areaPanel.height / 2,
      '',
      11,
    ).setWordWrapWidth(layout.areaPanel.width - 10);

    // Kartu Pengepak: lampu, status, baterai.
    const card = layout.packer.card;
    this.rect(scene, card, HALL.zoneFill, HALL.zoneFillAlpha, DEPTH.track);
    this.text(scene, card.x + 70, card.y + 10, 'Pengepak · menunggu sinyal', 10);
    const { lamp, battery } = layout.packer;
    this.lamp = this.track(
      scene.add
        .circle(lamp.x, lamp.y, 11, DESK.lampRed)
        .setStrokeStyle(2, DESK.lampStroke)
        .setDepth(DEPTH.gate),
    );
    this.lampText = this.text(scene, lamp.x + 18, lamp.y, '', 10).setOrigin(0, 0.5);
    this.packerText = this.text(scene, card.x + card.width - 70, lamp.y, '', 10);
    this.battery = new BatteryMeter(scene, battery.x, battery.y);

    this.update(snapshot, tools);
  }

  update(
    snapshot: Readonly<Snapshot>,
    tools: readonly PlacedTool[],
    events: readonly SimEvent[] = [],
    durationMs: number = this.durationMs,
  ): void {
    if (events.some((e) => e.type === 'INSTRUCTION' && e.op === 'COND_SIGNAL')) {
      this.signaled = true;
    }
    const names = new Map(snapshot.threads.map((t) => [t.id, t.label]));
    const nameOf = (id: string): string => names.get(id) ?? id;

    snapshot.threads.forEach((thread) => {
      const robot = this.robots.find((r) => r.threadId === thread.id);
      const xs = this.xs.get(thread.id) ?? [];
      robot?.moveTo(lineRobotX(thread.pc, xs), durationMs);
      robot?.update(thread);
      const card = this.cards.find((c) => c.threadId === thread.id);
      if (card !== undefined) {
        card.frame.setStrokeStyle(2, STATE_STYLE[thread.state].color);
        card.text.setText(
          [thread.label, statusLabel(thread), robotDetail(thread, card.totalRounds)].join('\n'),
        );
      }
    });

    const mutex = snapshot.mutexes.find((m) => m.id === this.layout.tools.mutexId);
    const locked = mutex?.owner !== null && mutex?.owner !== undefined;
    const lockStyle = locked ? DOOR_STYLE.locked : DOOR_STYLE.free;
    this.mutexPanel.setStrokeStyle(3, lockStyle.color);
    const mutexLines = [`Pintu Kunci · ${lockStyle.label}`];
    if (mutex?.owner) mutexLines.push(`Dipegang: ${nameOf(mutex.owner)}`);
    if (mutex && mutex.queue.length > 0) {
      mutexLines.push(`Antre: ${mutex.queue.map(nameOf).join(', ')}`);
    }
    this.mutexText.setText(mutexLines.join('\n'));

    const semaphore = snapshot.semaphores.find((s) => s.id === this.layout.tools.semaphoreId);
    const gated = tools.some((tool) => tool.kind === 'semaphore');
    const occupancy = snapshot.areaOccupancy[this.layout.hall.id] ?? 0;
    const overload = occupancy > this.capacity;
    this.areaPanel.setStrokeStyle(3, overload ? HALL.overloadColor : HALL.zoneStroke);
    this.areaText.setText(
      [
        overload ? `BENTROK · ${occupancy}/${this.capacity}` : `Aula Mesin · ${occupancy}/${this.capacity}`,
        gated ? `Kartu sisa ${semaphore?.value ?? 0}` : 'Kartu Akses belum dipasang',
      ].join('\n'),
    );

    for (const { gate, bar } of this.gateBars) {
      const color =
        gate.kind === 'mutex'
          ? lockStyle.color
          : (semaphore?.value ?? 0) > 0
            ? HALL.doorOpen
            : HALL.doorClosed;
      bar.setFillStyle(color);
    }

    this.boardText.setText(
      ['Papan Stok', ...Object.entries(snapshot.sharedVars).map(([k, v]) => `${k}: ${v}`)].join('\n'),
    );

    this.lamp.setFillStyle(this.signaled ? DESK.lampGreen : DESK.lampRed);
    this.lampText.setText(this.signaled ? 'HIJAU' : 'MERAH');
    const packer = snapshot.threads.find((t) => t.id === this.layout.packer.threadId);
    if (packer !== undefined) {
      const sleeping =
        packer.state === 'WAITING' &&
        packer.waitingOn === `cond:${this.layout.tools.conditionId}`;
      this.packerText.setText(
        sleeping
          ? 'TIDUR (zzz)'
          : packer.state === 'TERMINATED'
            ? 'Selesai'
            : packer.busyWaitTicks > 0
              ? 'busy waiting'
              : 'Menunggu / bekerja',
      );
      this.battery.update(batteryLevel(packer.busyWaitTicks));
    }
  }

  destroy(): void {
    this.battery.destroy();
    for (const robot of this.robots) robot.destroy();
    for (const object of this.objects) object.destroy();
    this.objects.length = 0;
  }

  private rect(
    scene: Scene,
    rect: Rect,
    color: number,
    alpha: number,
    depth: number,
  ): GameObjects.Rectangle {
    return this.track(
      scene.add
        .rectangle(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width, rect.height, color, alpha)
        .setStrokeStyle(HALL.zoneStrokeWidth, HALL.zoneStroke)
        .setDepth(depth),
    );
  }

  private text(
    scene: Scene,
    x: number,
    y: number,
    content: string,
    size = 11,
  ): GameObjects.Text {
    return this.track(
      scene.add
        .text(x, y, content, { ...TEXT_STYLE, fontSize: `${size}px`, color: COLORS.text })
        .setOrigin(0.5)
        .setDepth(DEPTH.robotLabel),
    );
  }

  private track<T extends GameObjects.GameObject>(object: T): T {
    this.objects.push(object);
    return object;
  }
}

const ROAD_COLOR = 0x2b364f;
const ROAD_EDGE = 0x4b5b80;
const CHECKPOINT_FILL = 0x1f2a44;
const CHECKPOINT_STROKE = 0xf5c542;
const BOARD_FILL = 0x1f2a44;
const BOARD_LINK = 0x93a4c8;