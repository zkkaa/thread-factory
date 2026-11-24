import { GameObjects, type Scene } from 'phaser';
import { batteryLevel } from '../../engine/metrics';
import type { PlacedTool } from '../../engine/tools';
import type {
  SimEvent,
  Snapshot,
  ThreadDef,
  ThreadSnapshot,
} from '../../engine/types';
import type { LevelDefinition } from '../../levels/types';
import { robotFrameFor } from '../assetManifest';
import { assignFlowSpots, flowRobots, type FlowSeats } from '../flowSpots';
import type { FlowLayout, Point, Rect } from '../layouts/types';
import { BatteryMeter } from '../views/BatteryMeter';
import { HallRobotView } from '../views/HallRobotView';
import { COLORS, DEPTH, DESK, HALL, TEXT_STYLE } from '../theme';

interface RobotEntry {
  id: string;
  view: HallRobotView;
}

/**
 * Arena alur Level 1-5 (A kerja, B aula, C papan stok, D pengepak, E selesai),
 * dipakai LevelScene bila layout berjenis 'flow'. Posisi robot dipilih fungsi
 * murni di flowSpots.ts; kelas ini hanya menggambar. Tidak ada aturan
 * permainan di sini: bentrok, stok, dan baterai datang dari engine.
 */
export class FlowArena {
  private readonly objects: GameObjects.GameObject[] = [];
  private readonly robots: RobotEntry[] = [];
  private readonly packerView: HallRobotView;
  private readonly battery: BatteryMeter;
  private readonly capacity: number;
  private readonly variable: string;
  private readonly target: number;
  private seats: FlowSeats = { hall: new Map(), stock: new Map() };
  private signaled = false;

  private readonly hallPanel: GameObjects.Rectangle;
  private readonly hallCounter: GameObjects.Text;
  private readonly hallBanner: GameObjects.Text;
  private readonly hallDoor: GameObjects.Rectangle;
  private readonly hallDoorLabel: GameObjects.Text;
  private readonly machines: GameObjects.Rectangle[] = [];
  private readonly stockCount: GameObjects.Text;
  private readonly stockInside: GameObjects.Text;
  private readonly stockDoor: GameObjects.Rectangle;
  private readonly stockDoorLabel: GameObjects.Text;
  private readonly lamp: GameObjects.Arc;
  private readonly lampLabel: GameObjects.Text;
  private readonly zzz: GameObjects.Text;
  private readonly packerStatus: GameObjects.Text;

  constructor(
    scene: Scene,
    private readonly layout: FlowLayout,
    level: LevelDefinition,
    snapshot: Readonly<Snapshot>,
    private readonly effective: readonly ThreadDef[],
    tools: readonly PlacedTool[],
  ) {
    this.capacity = level.areas?.[layout.area] ?? layout.machines.length;
    this.variable = level.goal.target.variable;
    this.target = level.goal.target.value;

    this.zone(scene, layout.workZone, 'A · Kerja');
    this.hallPanel = this.zone(scene, layout.hallZone, 'B · Aula Mesin');
    this.zone(scene, layout.stockZone, 'C · Papan Stok');
    this.zone(scene, layout.packZone, 'D · Pengepak');
    this.zone(scene, layout.doneZone, 'E · Selesai');

    // B: hitungan aula, spanduk bentrok, mesin, pintu kartu.
    const hallX = layout.hallZone.x + layout.hallZone.width / 2;
    this.hallCounter = this.text(
      scene,
      hallX,
      layout.hallZone.y + HALL.counterInset,
      HALL.counterFontSize,
    );
    this.hallBanner = this.text(
      scene,
      hallX,
      layout.hallZone.y + layout.hallZone.height + HALL.bannerGap,
      HALL.doorLabelFontSize,
      HALL.overloadText,
    ).setVisible(false);
    layout.machines.forEach((p, index) => {
      this.machines.push(
        this.track(
          scene.add
            .rectangle(
              p.x,
              p.y,
              HALL.machineSize,
              HALL.machineSize,
              HALL.machineIdle,
            )
            .setStrokeStyle(HALL.machineStrokeWidth, HALL.machineStroke)
            .setDepth(DEPTH.segment),
        ),
      );
      this.text(
        scene,
        p.x,
        p.y - HALL.machineSize / 2 - HALL.machineLabelGap,
        HALL.machineFontSize,
      ).setText(`Mesin ${index + 1}`);
    });
    this.hallDoor = this.bar(scene, layout.hallDoor);
    this.hallDoorLabel = this.text(
      scene,
      layout.hallDoor.x,
      layout.hallDoor.y - HALL.doorLength / 2 - HALL.doorLabelGap,
      HALL.doorLabelFontSize,
    );

    // C: papan stok, gerbang mutex, jumlah robot di area kritis.
    const board = layout.stockBoard;
    this.track(
      scene.add
        .rectangle(
          board.x + board.width / 2,
          board.y + board.height / 2,
          board.width,
          board.height,
          DESK.tableFill,
        )
        .setStrokeStyle(DESK.tableStrokeWidth, DESK.tableStroke)
        .setDepth(DEPTH.segment),
    );
    this.stockCount = this.text(
      scene,
      board.x + board.width / 2,
      board.y + board.height / 2,
      DESK.lampLabelFontSize,
    );
    this.stockDoor = this.bar(scene, layout.stockDoor);
    this.stockDoorLabel = this.text(
      scene,
      layout.stockDoor.x,
      layout.stockDoor.y - HALL.doorLength / 2 - HALL.doorLabelGap,
      HALL.doorLabelFontSize,
    );
    this.stockInside = this.text(
      scene,
      layout.stockZone.x + layout.stockZone.width / 2,
      layout.stockZone.y + layout.stockZone.height - HALL.zoneTitleInset - 8,
      HALL.doorLabelFontSize,
    );

    // D: pengepak, lampu, zzz, baterai.
    const { packerSpot, lamp, battery } = layout;
    this.lamp = this.track(
      scene.add
        .circle(lamp.x, lamp.y, DESK.lampRadius, DESK.lampRed)
        .setStrokeStyle(DESK.lampStrokeWidth, DESK.lampStroke)
        .setDepth(DEPTH.gate),
    );
    this.lampLabel = this.text(
      scene,
      lamp.x,
      lamp.y - DESK.lampRadius - DESK.lampLabelGap,
      DESK.lampLabelFontSize,
    );
    this.zzz = this.text(
      scene,
      packerSpot.x + 26,
      packerSpot.y - 22,
      DESK.zzzFontSize,
      '#bfdbfe',
    )
      .setText('zzz')
      .setVisible(false);
    this.packerStatus = this.text(
      scene,
      battery.x,
      battery.y + DESK.modeGap,
      DESK.modeFontSize,
    );
    this.battery = new BatteryMeter(scene, battery.x, battery.y, 1);

    // Robot: perakit lalu pengepak, dibuat paling akhir agar di atas zona.
    const placement = this.placement(snapshot);
    this.seats = placement.seats;
    let assemblerIndex = 0;
    snapshot.threads.forEach((thread, threadIndex) => {
      const rounds =
        level.threads.find((def) => def.id === thread.id)?.repeat ?? 1;
      if (thread.id === layout.packerId) return;
      const view = new HallRobotView(scene, thread, {
        start:
          placement.spots.get(thread.id) ?? layout.workSpots[0] ?? packerSpot,
        spriteFrame: robotFrameFor(assemblerIndex),
        totalRounds: rounds,
      });
      this.robots.push({ id: thread.id, view });
      assemblerIndex += 1;
      void threadIndex;
    });
    const packer = snapshot.threads.find((t) => t.id === layout.packerId);
    if (packer === undefined) {
      throw new Error(`Pengepak "${layout.packerId}" tidak ada di snapshot.`);
    }
    this.packerView = new HallRobotView(scene, packer, {
      start: packerSpot,
      spriteFrame: robotFrameFor(robots(snapshot, layout.packerId)),
      totalRounds: 1,
    });

    this.update(snapshot, tools, [], 0);
  }

  update(
    snapshot: Readonly<Snapshot>,
    tools: readonly PlacedTool[],
    events: readonly SimEvent[],
    durationMs: number,
  ): void {
    const { layout } = this;
    if (
      events.some((e) => e.type === 'INSTRUCTION' && e.op === 'COND_SIGNAL')
    ) {
      this.signaled = true;
    }

    // Robot perakit.
    const placement = this.placement(snapshot);
    this.seats = placement.seats;
    const overflow = new Set<string>();
    const active = new Set<number>();
    for (const [id, seat] of placement.seats.hall) {
      if (seat >= layout.machines.length) overflow.add(id);
      else active.add(seat);
    }
    for (const { id, view } of this.robots) {
      const thread = snapshot.threads.find((t) => t.id === id);
      if (thread === undefined) continue;
      const spot = placement.spots.get(id);
      if (spot !== undefined) view.moveTo(spot, durationMs);
      view.update(thread, overflow.has(id));
    }

    // B: aula dan pintu kartu.
    const occupancy = snapshot.areaOccupancy[layout.area] ?? 0;
    const crowded = occupancy > this.capacity;
    this.hallCounter
      .setText(`Aula: ${occupancy} / ${this.capacity}`)
      .setColor(crowded ? HALL.overloadText : COLORS.text);
    this.hallPanel
      .setStrokeStyle(
        crowded ? HALL.overloadStrokeWidth : HALL.zoneStrokeWidth,
        crowded ? HALL.overloadColor : HALL.zoneStroke,
      )
      .setFillStyle(
        crowded ? HALL.overloadColor : HALL.zoneFill,
        crowded ? HALL.overloadFillAlpha : HALL.zoneFillAlpha,
      );
    this.hallBanner
      .setText(`BENTROK! ${occupancy} robot, kapasitas ${this.capacity}`)
      .setVisible(crowded);
    this.machines.forEach((box, index) =>
      box.setFillStyle(
        active.has(index) ? HALL.machineActive : HALL.machineIdle,
      ),
    );
    const cardGated = tools.some((tool) => tool.kind === 'semaphore');
    const cards = snapshot.semaphores.find(
      (s) => s.id === layout.tools.semaphoreId,
    )?.value;
    if (!cardGated) {
      this.hallDoor.setFillStyle(HALL.doorFree);
      this.hallDoorLabel.setText('PINTU BEBAS (tanpa kartu)');
    } else if ((cards ?? 0) > 0) {
      this.hallDoor.setFillStyle(HALL.doorOpen);
      this.hallDoorLabel.setText(`KARTU · sisa ${cards ?? 0}`);
    } else {
      this.hallDoor.setFillStyle(HALL.doorClosed);
      this.hallDoorLabel.setText('KARTU · HABIS');
    }

    // C: papan stok dan gerbang mutex.
    this.stockCount.setText(
      `${this.variable}: ${snapshot.sharedVars[this.variable] ?? 0} / ${this.target}`,
    );
    const mutexGated = tools.some((tool) => tool.kind === 'mutex');
    const mutex = snapshot.mutexes.find((m) => m.id === layout.tools.mutexId);
    if (!mutexGated) {
      this.stockDoor.setFillStyle(HALL.doorFree);
      this.stockDoorLabel.setText('PINTU BEBAS (tanpa mutex)');
    } else if (mutex?.owner != null) {
      const owner = snapshot.threads.find((t) => t.id === mutex.owner);
      this.stockDoor.setFillStyle(HALL.doorClosed);
      this.stockDoorLabel.setText(`TERKUNCI · ${owner?.label ?? mutex.owner}`);
    } else {
      this.stockDoor.setFillStyle(HALL.doorOpen);
      this.stockDoorLabel.setText('MUTEX · BEBAS');
    }
    const inside = placement.robots.filter((r) => r.zone === 'stock').length;
    this.stockInside.setText(`Di area kritis: ${inside} robot`);

    // D: pengepak, lampu, baterai.
    const packer = snapshot.threads.find((t) => t.id === layout.packerId);
    if (packer === undefined) return;
    this.packerView.update(packer, false);
    this.lamp.setFillStyle(this.signaled ? DESK.lampGreen : DESK.lampRed);
    this.lampLabel.setText(this.signaled ? 'LAMPU HIJAU' : 'LAMPU MERAH');
    const sleeping =
      packer.state === 'WAITING' &&
      packer.waitingOn?.startsWith('cond:') === true;
    this.zzz.setVisible(sleeping);
    this.packerStatus.setText(this.packerMode(packer, sleeping));
    this.battery.update(batteryLevel(packer.busyWaitTicks));
  }

  destroy(): void {
    for (const { view } of this.robots) view.destroy();
    this.packerView.destroy();
    this.battery.destroy();
    for (const object of this.objects) object.destroy();
    this.objects.length = 0;
  }

  private packerMode(packer: ThreadSnapshot, sleeping: boolean): string {
    if (packer.state === 'TERMINATED') return 'Selesai mengepak';
    if (sleeping) return 'TIDUR · WAITING (hemat core)';
    const op = this.effective.find((d) => d.id === packer.id)?.program[
      packer.pc
    ]?.op;
    if (op === 'SPIN_UNTIL') return 'Mengecek terus · busy waiting';
    if (packer.state === 'WAITING') return 'Menunggu kunci meja';
    return 'Mengepak';
  }

  private placement(snapshot: Readonly<Snapshot>) {
    const robots = flowRobots(
      this.effective,
      snapshot.threads,
      this.layout.area,
      this.layout.packerId,
    );
    const hallWaiting = snapshot.semaphores.flatMap((s) => s.queue);
    const stockWaiting = snapshot.mutexes.flatMap((m) => m.queue);
    const { spots, seats } = assignFlowSpots(
      this.layout,
      robots,
      hallWaiting,
      stockWaiting,
      this.seats,
    );
    return { robots, spots, seats };
  }

  private zone(scene: Scene, rect: Rect, title: string): GameObjects.Rectangle {
    const panel = this.track(
      scene.add
        .rectangle(
          rect.x + rect.width / 2,
          rect.y + rect.height / 2,
          rect.width,
          rect.height,
          HALL.zoneFill,
          HALL.zoneFillAlpha,
        )
        .setStrokeStyle(HALL.zoneStrokeWidth, HALL.zoneStroke)
        .setDepth(DEPTH.track),
    );
    this.text(
      scene,
      rect.x + rect.width / 2,
      rect.y + HALL.zoneTitleInset + 6,
      HALL.titleFontSize,
    ).setText(title);
    return panel;
  }

  private bar(scene: Scene, at: Point): GameObjects.Rectangle {
    return this.track(
      scene.add
        .rectangle(
          at.x,
          at.y,
          HALL.doorThickness,
          HALL.doorLength,
          HALL.doorFree,
        )
        .setDepth(DEPTH.gate),
    );
  }

  private text(
    scene: Scene,
    x: number,
    y: number,
    fontSize: string,
    color: string = COLORS.text,
  ): GameObjects.Text {
    return this.track(
      scene.add
        .text(x, y, '', { ...TEXT_STYLE, fontSize, color })
        .setOrigin(0.5)
        .setDepth(DEPTH.slot),
    );
  }

  private track<T extends GameObjects.GameObject>(object: T): T {
    this.objects.push(object);
    return object;
  }
}

/** Indeks pengepak di snapshot, dipakai memilih frame sprite. */
function robots(snapshot: Readonly<Snapshot>, packerId: string): number {
  return Math.max(
    0,
    snapshot.threads.findIndex((t) => t.id === packerId),
  );
}
