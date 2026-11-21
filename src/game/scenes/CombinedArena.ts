import { GameObjects, type Scene } from 'phaser';
import { batteryLevel } from '../../engine/metrics';
import type { PlacedTool } from '../../engine/tools';
import type { SimEvent, Snapshot } from '../../engine/types';
import type { LevelDefinition } from '../../levels/types';
import { GateDragSession, type GateDropState } from '../gateDrag';
import type { CombinedLayout, Rect } from '../layouts/types';
import { pointAt } from '../pathMath';
import { buildRoad } from '../roadGeometry';
import { robotDetail, statusLabel } from '../robotLabel';
import { clientToGame } from '../slots';
import {
  ARENA,
  COLORS,
  COMBINED,
  DEPTH,
  DESK,
  HALL,
  STATE_STYLE,
  TEXT_STYLE,
} from '../theme';
import { toolBus } from '../toolBus';
import { BatteryMeter } from '../views/BatteryMeter';

/** Baris status satu robot di kartu stasiunnya (menggantikan label robot yang panjang). */
interface RoleCard {
  threadId: string;
  totalRounds: number;
  swatch: GameObjects.Arc;
  status: GameObjects.Text;
  detail: GameObjects.Text;
}

/**
 * Kartu stasiun Level 1-5 di kolom kanan arena: Perakit, Penggudang, Aula Mesin,
 * dan Pengepak. Nilai status selalu dibaca dari snapshot; aturan lulus,
 * kapasitas, dan sinkronisasi tetap dimiliki engine/controller. Detail robot
 * ("Produk 1/3, tunggu 0", catatan register) tampil di kartu, bukan di label
 * robot pada loop, supaya label tidak bertumpuk. Langkah aula pada loop
 * ditandai cincin teal.
 */
export class CombinedArena {
  private readonly objects: GameObjects.GameObject[] = [];
  private readonly assembler: RoleCard;
  private readonly warehouse: RoleCard;
  private readonly areaCapacity: number;
  private readonly areaStatus: GameObjects.Text;
  private readonly tokenStatus: GameObjects.Text;
  private readonly lamp: GameObjects.Arc;
  private readonly lampStatus: GameObjects.Text;
  private readonly packerStatus: GameObjects.Text;
  private readonly sleeping: GameObjects.Text;
  private readonly door: GameObjects.Rectangle;
  private readonly doorLabel: GameObjects.Text;
  private readonly dropRing: GameObjects.Arc;
  private readonly dropLabel: GameObjects.Text;
  private readonly battery: BatteryMeter;
  private readonly gateDrag: GateDragSession;
  private signaled = false;

  constructor(
    scene: Scene,
    private readonly layout: CombinedLayout,
    level: LevelDefinition,
    snapshot: Readonly<Snapshot>,
    tools: readonly PlacedTool[],
  ) {
    const { area, packer } = layout;
    this.addZone(scene, layout.assembler.zone, 'Perakit · tambah barang');
    this.addZone(scene, layout.warehouse.zone, 'Penggudang · simpan barang');
    this.addZone(scene, area.zone, 'Aula Mesin · cincin teal = langkah aula');
    this.addZone(scene, packer.zone, 'Pengepak · menunggu sinyal');

    const roundsOf = (threadId: string): number =>
      level.threads.find((def) => def.id === threadId)?.repeat ?? 1;
    this.assembler = this.addRole(
      scene,
      layout.assembler.zone,
      layout.assembler.threadId,
      roundsOf(layout.assembler.threadId),
      COMBINED.roleStatusY,
      COMBINED.roleDetailY,
    );
    this.warehouse = this.addRole(
      scene,
      layout.warehouse.zone,
      layout.warehouse.threadId,
      roundsOf(layout.warehouse.threadId),
      COMBINED.warehouseStatusY,
      COMBINED.warehouseDetailY,
    );

    // Cincin teal pada checkpoint langkah aula (ENTER_AREA sampai LEAVE_AREA).
    const path = buildRoad(layout.road).path;
    for (let i = area.gate.start; i <= area.gate.end; i += 1) {
      const fraction = layout.checkpoints[i];
      if (fraction === undefined) continue;
      const p = pointAt(path, fraction, 0);
      this.track(
        scene.add
          .circle(p.x, p.y, COMBINED.ringRadius, HALL.dropReady, 0)
          .setStrokeStyle(COMBINED.ringStroke, HALL.dropReady)
          .setDepth(DEPTH.slot),
      );
    }

    this.areaCapacity = level.areas?.[area.id] ?? 0;
    const textX = area.zone.x + area.zone.width * COMBINED.areaTextXRatio;
    this.areaStatus = this.addText(
      scene,
      textX,
      area.zone.y + COMBINED.areaStatusY,
      '',
    );
    this.tokenStatus = this.addText(
      scene,
      textX,
      area.zone.y + COMBINED.areaTokenY,
      '',
    );
    this.doorLabel = this.addText(
      scene,
      textX,
      area.zone.y + COMBINED.areaDoorLabelY,
      '',
    );
    area.machines.forEach((machine, index) => {
      this.track(
        scene.add
          .rectangle(
            machine.x,
            machine.y,
            COMBINED.machineSize,
            COMBINED.machineSize,
            HALL.machineIdle,
          )
          .setStrokeStyle(2, HALL.machineStroke)
          .setDepth(DEPTH.segment),
      );
      this.addText(
        scene,
        machine.x,
        machine.y + COMBINED.machineLabelGap,
        `Mesin ${index + 1}`,
      );
    });
    this.door = this.track(
      scene.add
        .rectangle(
          area.door.x,
          area.door.y,
          COMBINED.doorWidth,
          COMBINED.doorHeight,
          HALL.doorFree,
        )
        .setDepth(DEPTH.gate),
    );
    this.dropRing = this.track(
      scene.add
        .circle(area.door.x, area.door.y, COMBINED.dropRadius, HALL.dropReady, 0)
        .setStrokeStyle(HALL.dropStrokeWidth, HALL.dropReady)
        .setDepth(DEPTH.robotFx)
        .setVisible(false),
    );
    this.dropLabel = this.addText(
      scene,
      area.zone.x + area.zone.width / 2,
      area.zone.y + COMBINED.areaDropLabelY,
      '',
    ).setVisible(false);

    this.lamp = this.track(
      scene.add
        .circle(packer.lamp.x, packer.lamp.y, COMBINED.lampRadius, DESK.lampRed)
        .setStrokeStyle(2, DESK.lampStroke)
        .setDepth(DEPTH.gate),
    );
    this.lampStatus = this.addText(
      scene,
      packer.lamp.x + COMBINED.lampLabelGap,
      packer.lamp.y,
      '',
    ).setOrigin(0, 0.5);
    this.sleeping = this.track(
      scene.add
        .text(packer.lamp.x + COMBINED.zzzGap, packer.lamp.y, 'zzz', {
          ...TEXT_STYLE,
          fontSize: '13px',
          color: '#bfdbfe',
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.robotFx)
        .setVisible(false),
    );
    this.packerStatus = this.addText(
      scene,
      packer.zone.x + packer.zone.width / 2,
      packer.lamp.y + COMBINED.packerStatusGap,
      '',
    );
    this.battery = new BatteryMeter(scene, packer.battery.x, packer.battery.y);
    this.gateDrag = new GateDragSession({
      bus: toolBus,
      door: area.door,
      hitRadius: COMBINED.dropRadius,
      gate: area.gate,
      toGame: (point) =>
        clientToGame(
          point.clientX,
          point.clientY,
          scene.game.canvas.getBoundingClientRect(),
          ARENA,
        ),
      setState: (state) => this.setDropState(state),
    });

    this.update(snapshot, tools);
  }

  private setDropState(state: GateDropState): void {
    const visible = state !== 'off';
    this.dropRing.setVisible(visible);
    this.dropLabel.setVisible(visible);
    if (!visible) return;
    const over = state === 'over';
    this.dropRing
      .setFillStyle(
        HALL.dropReady,
        over ? HALL.dropOverAlpha : HALL.dropReadyAlpha,
      )
      .setStrokeStyle(
        HALL.dropStrokeWidth,
        over ? HALL.dropOver : HALL.dropReady,
      );
    this.dropLabel.setText(over ? 'LEPAS SEKARANG' : 'LEPAS KARTU DI SINI');
  }

  update(
    snapshot: Readonly<Snapshot>,
    tools: readonly PlacedTool[],
    events: readonly SimEvent[] = [],
  ): void {
    if (
      events.some(
        (event) => event.type === 'INSTRUCTION' && event.op === 'COND_SIGNAL',
      )
    ) {
      this.signaled = true;
    }

    this.updateRole(this.assembler, snapshot);
    this.updateRole(this.warehouse, snapshot);

    const occupancy = snapshot.areaOccupancy[this.layout.area.id] ?? 0;
    this.areaStatus.setText(
      occupancy > this.areaCapacity
        ? `BENTROK · ${occupancy}/${this.areaCapacity}`
        : `Isi aula: ${occupancy}/${this.areaCapacity}`,
    );
    const semaphore = snapshot.semaphores.find(
      (item) => item.id === this.layout.tools.semaphoreId,
    );
    const gate = tools.find(
      (tool): tool is Extract<PlacedTool, { kind: 'semaphore' }> =>
        tool.kind === 'semaphore',
    );
    this.tokenStatus.setText(
      gate !== undefined
        ? `Kartu Akses terpasang · sisa ${semaphore?.value ?? gate.value}`
        : 'Kartu Akses belum dipasang',
    );
    this.door.setFillStyle(
      gate !== undefined
        ? (semaphore?.value ?? 0) > 0
          ? HALL.doorOpen
          : HALL.doorClosed
        : HALL.doorFree,
    );
    this.doorLabel.setText(
      gate !== undefined ? 'GERBANG KARTU AKTIF' : 'PINTU BEBAS',
    );

    this.lamp.setFillStyle(this.signaled ? DESK.lampGreen : DESK.lampRed);
    this.lampStatus.setText(this.signaled ? 'LAMPU HIJAU' : 'LAMPU MERAH');
    const packer = snapshot.threads.find(
      (thread) => thread.id === this.layout.packer.threadId,
    );
    if (packer === undefined) {
      throw new Error(
        `Thread pengepak "${this.layout.packer.threadId}" tidak ada.`,
      );
    }
    const sleeping =
      packer.state === 'WAITING' &&
      packer.waitingOn === `cond:${this.layout.tools.conditionId}`;
    this.sleeping.setVisible(sleeping);
    this.packerStatus.setText(
      sleeping
        ? 'TIDUR · WAITING (hemat core)'
        : packer.state === 'TERMINATED'
          ? 'Pengepakan selesai'
          : packer.busyWaitTicks > 0
            ? 'Mengecek terus · busy waiting'
            : 'Menunggu barang / bekerja',
    );
    this.battery.update(batteryLevel(packer.busyWaitTicks));
  }

  destroy(): void {
    this.battery.destroy();
    this.gateDrag.dispose();
    for (const object of this.objects) object.destroy();
    this.objects.length = 0;
  }

  private updateRole(card: RoleCard, snapshot: Readonly<Snapshot>): void {
    const thread = snapshot.threads.find((item) => item.id === card.threadId);
    if (thread === undefined) return;
    card.swatch.setFillStyle(STATE_STYLE[thread.state].color);
    card.status.setText(`${thread.label} · ${statusLabel(thread)}`);
    card.detail.setText(robotDetail(thread, card.totalRounds));
  }

  /** Penanda warna state + teks status + detail di dalam kartu. */
  private addRole(
    scene: Scene,
    zone: Rect,
    threadId: string,
    totalRounds: number,
    statusY: number,
    detailY: number,
  ): RoleCard {
    const left = zone.x + COMBINED.roleInsetX;
    const swatch = this.track(
      scene.add
        .circle(left, zone.y + statusY, COMBINED.roleSwatchRadius, 0x9ca3af)
        .setStrokeStyle(1, COLORS.robotBorder)
        .setDepth(DEPTH.slot),
    );
    const status = this.addText(
      scene,
      left + COMBINED.roleSwatchRadius + 8,
      zone.y + statusY,
      '',
    ).setOrigin(0, 0.5);
    const detail = this.addText(
      scene,
      left - COMBINED.roleSwatchRadius,
      zone.y + detailY,
      '',
      COMBINED.detailFontSize,
    ).setOrigin(0, 0.5);
    return { threadId, totalRounds, swatch, status, detail };
  }

  private addZone(scene: Scene, rect: Rect, title: string): void {
    this.track(
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
    this.addText(
      scene,
      rect.x + rect.width / 2,
      rect.y + COMBINED.titleInset,
      title,
      COMBINED.titleFontSize,
    ).setOrigin(0.5, 0);
  }

  private addText(
    scene: Scene,
    x: number,
    y: number,
    text: string,
    fontSize: string = COMBINED.textFontSize,
  ): GameObjects.Text {
    return this.track(
      scene.add
        .text(x, y, text, { ...TEXT_STYLE, fontSize, color: COLORS.text })
        .setOrigin(0.5)
        .setDepth(DEPTH.slot),
    );
  }

  private track<T extends GameObjects.GameObject>(object: T): T {
    this.objects.push(object);
    return object;
  }
}