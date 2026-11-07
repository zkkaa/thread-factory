import { GameObjects, type Scene } from 'phaser';
import { batteryLevel } from '../../engine/metrics';
import type { SimEvent, Snapshot } from '../../engine/types';
import type { LevelDefinition } from '../../levels/types';
import type { PlacedTool } from '../../engine/tools';
import { GateDragSession, type GateDropState } from '../gateDrag';
import type { CombinedLayout, Rect } from '../layouts/types';
import { BatteryMeter } from '../views/BatteryMeter';
import { clientToGame } from '../slots';
import { toolBus } from '../toolBus';
import { ARENA, COLORS, DEPTH, HALL, TEXT_STYLE } from '../theme';

/**
 * Panel stasiun Level 1-5. Nilai status selalu dibaca dari snapshot; aturan
 * lulus, kapasitas, dan sinkronisasi tetap dimiliki engine/controller.
 */
export class CombinedArena {
  private readonly objects: GameObjects.GameObject[] = [];
  private readonly areaStatus: GameObjects.Text;
  private readonly tokenStatus: GameObjects.Text;
  private readonly mutexStatus: GameObjects.Text;
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
    this.addZone(scene, layout.assembler.zone, 'Perakit · tambah barang');
    this.addZone(scene, layout.warehouse.zone, 'Penggudang · simpan barang');
    this.addZone(scene, layout.area.zone, 'Aula Mesin · kapasitas terbatas');
    this.addZone(scene, layout.packer.zone, 'Pengepak · menunggu sinyal');

    const areaCapacity = level.areas?.[layout.area.id] ?? 0;
    this.areaCapacity = areaCapacity;
    this.areaStatus = this.addText(
      scene,
      layout.area.zone.x + layout.area.zone.width / 2,
      layout.area.zone.y + 35,
      '',
    );
    this.tokenStatus = this.addText(
      scene,
      layout.area.zone.x + layout.area.zone.width / 2,
      layout.area.zone.y + 58,
      '',
    );
    layout.area.machines.forEach((machine, index) => {
      this.track(
        scene.add
          .rectangle(machine.x, machine.y, 36, 36, HALL.machineIdle)
          .setStrokeStyle(2, HALL.machineStroke)
          .setDepth(DEPTH.segment),
      );
      this.addText(scene, machine.x, machine.y + 30, `Mesin ${index + 1}`);
    });
    this.door = this.track(
      scene.add
        .rectangle(
          layout.area.door.x,
          layout.area.door.y,
          10,
          54,
          HALL.doorFree,
        )
        .setDepth(DEPTH.gate),
    );
    this.doorLabel = this.addText(
      scene,
      layout.area.door.x,
      layout.area.door.y + 42,
      '',
    );
    this.dropRing = this.track(
      scene.add
        .circle(layout.area.door.x, layout.area.door.y, 52, HALL.dropReady, 0)
        .setStrokeStyle(HALL.dropStrokeWidth, HALL.dropReady)
        .setDepth(DEPTH.robotFx)
        .setVisible(false),
    );
    this.dropLabel = this.addText(
      scene,
      layout.area.door.x,
      layout.area.door.y + 62,
      '',
    ).setVisible(false);

    const packer = layout.packer;
    this.lamp = this.track(
      scene.add
        .circle(packer.lamp.x, packer.lamp.y, 13, 0xef4444)
        .setStrokeStyle(2, 0xf9fafb)
        .setDepth(DEPTH.gate),
    );
    this.lampStatus = this.addText(
      scene,
      packer.lamp.x,
      packer.lamp.y - 24,
      '',
    );
    this.sleeping = this.track(
      scene.add
        .text(packer.lamp.x, packer.lamp.y + 23, 'zzz', {
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
      packer.zone.y + 108,
      '',
    );
    this.battery = new BatteryMeter(scene, packer.battery.x, packer.battery.y);
    this.gateDrag = new GateDragSession({
      bus: toolBus,
      door: layout.area.door,
      hitRadius: 52,
      gate: layout.area.gate,
      toGame: (point) =>
        clientToGame(
          point.clientX,
          point.clientY,
          scene.game.canvas.getBoundingClientRect(),
          ARENA,
        ),
      setState: (state) => this.setDropState(state),
    });

    this.mutexStatus = this.addText(
      scene,
      layout.board.x + layout.board.width / 2,
      layout.board.y + layout.board.height + 16,
      '',
    );
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

  private readonly areaCapacity: number;

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

    const mutex = snapshot.mutexes.find(
      (item) => item.id === this.layout.tools.mutexId,
    );
    this.mutexStatus.setText(
      mutex?.owner === null || mutex === undefined
        ? 'Pintu Mutex: BEBAS'
        : `Pintu Mutex: DIPEGANG ${mutex.owner}`,
    );

    this.lamp.setFillStyle(this.signaled ? 0x22c55e : 0xef4444);
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
      rect.y + 12,
      title,
      '13px',
    ).setOrigin(0.5, 0);
  }

  private addText(
    scene: Scene,
    x: number,
    y: number,
    text: string,
    fontSize = '12px',
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
