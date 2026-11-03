import { GameObjects, Scene } from 'phaser';
import type { HallLayout, Rect } from '../layouts/types';
import { COLORS, DEPTH, HALL, TEXT_STYLE } from '../theme';

/** Keadaan aula pada satu tick, dihitung dari snapshot oleh HallArena. */
export interface HallViewState {
  /** Jumlah robot di dalam aula (dari engine). */
  occupancy: number;
  capacity: number;
  /** Nilai semaphore Kartu Akses (boleh negatif); null bila tidak ada. */
  cards: number | null;
  /** Indeks mesin yang sedang ditempati robot. */
  activeMachines: ReadonlySet<number>;
}

/**
 * Bagian tetap arena aula: zona (kerja, antrean, aula, selesai), pintu atau
 * gerbang kartu, tiga mesin, hitungan "Aula: n / kapasitas", dan spanduk
 * BENTROK saat jumlah robot melebihi kapasitas. Warna selalu disertai teks.
 * View ini hanya menggambar; bentrok ditentukan engine (areaOccupancy).
 */
export class HallView {
  private readonly objects: GameObjects.GameObject[] = [];
  private readonly gated: boolean;
  private readonly hallPanel: GameObjects.Rectangle;
  private readonly counter: GameObjects.Text;
  private readonly banner: GameObjects.Text;
  private readonly door: GameObjects.Rectangle;
  private readonly doorLabel: GameObjects.Text;
  private readonly machines: {
    box: GameObjects.Rectangle;
    label: GameObjects.Text;
  }[] = [];

  constructor(scene: Scene, layout: HallLayout, gated: boolean) {
    this.gated = gated;
    this.addZone(scene, layout.workZone, 'Area Kerja');
    this.addZone(
      scene,
      layout.queueZone,
      gated ? 'Antrean Kartu' : 'Menuju Aula',
    );
    this.hallPanel = this.addZone(scene, layout.hall, 'Aula Mesin');
    this.addZone(scene, layout.doneZone, 'Selesai');

    const centerX = layout.hall.x + layout.hall.width / 2;
    this.counter = this.track(
      scene.add
        .text(centerX, layout.hall.y + HALL.counterInset, '', {
          ...TEXT_STYLE,
          fontSize: HALL.counterFontSize,
        })
        .setOrigin(0.5, 0)
        .setDepth(DEPTH.slot),
    );
    this.banner = this.track(
      scene.add
        .text(centerX, layout.hall.y - HALL.bannerGap, '', {
          ...TEXT_STYLE,
          fontSize: HALL.bannerFontSize,
          color: HALL.overloadText,
        })
        .setOrigin(0.5, 1)
        .setDepth(DEPTH.robotFx)
        .setVisible(false),
    );

    layout.machines.forEach((p, index) => {
      const box = this.track(
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
      );
      const label = this.track(
        scene.add
          .text(
            p.x,
            p.y - HALL.machineSize / 2 - HALL.machineLabelGap,
            `Mesin ${index + 1}`,
            { ...TEXT_STYLE, fontSize: HALL.machineFontSize },
          )
          .setOrigin(0.5, 1)
          .setDepth(DEPTH.slot),
      );
      this.machines.push({ box, label });
    });

    this.door = this.track(
      scene.add
        .rectangle(
          layout.door.x,
          layout.door.y,
          HALL.doorThickness,
          HALL.doorLength,
          HALL.doorFree,
        )
        .setDepth(DEPTH.gate),
    );
    this.doorLabel = this.track(
      scene.add
        .text(
          layout.door.x,
          layout.door.y - HALL.doorLength / 2 - HALL.doorLabelGap,
          '',
          { ...TEXT_STYLE, fontSize: HALL.doorLabelFontSize },
        )
        .setOrigin(0.5, 1)
        .setDepth(DEPTH.gate),
    );
  }

  update(state: HallViewState): void {
    const overload = state.occupancy > state.capacity;
    this.counter
      .setText(`Aula: ${state.occupancy} / ${state.capacity}`)
      .setColor(overload ? HALL.overloadText : COLORS.text);
    this.hallPanel
      .setStrokeStyle(
        overload ? HALL.overloadStrokeWidth : HALL.zoneStrokeWidth,
        overload ? HALL.overloadColor : HALL.zoneStroke,
      )
      .setFillStyle(
        overload ? HALL.overloadColor : HALL.zoneFill,
        overload ? HALL.overloadFillAlpha : HALL.zoneFillAlpha,
      );
    this.banner
      .setText(`BENTROK! ${state.occupancy} robot, kapasitas ${state.capacity}`)
      .setVisible(overload);

    this.machines.forEach((machine, index) => {
      const active = state.activeMachines.has(index);
      machine.box.setFillStyle(active ? HALL.machineActive : HALL.machineIdle);
      machine.label.setText(
        active ? `Mesin ${index + 1} · aktif` : `Mesin ${index + 1}`,
      );
    });

    if (!this.gated) {
      this.door.setFillStyle(HALL.doorFree);
      this.doorLabel.setText('PINTU BEBAS (tanpa kartu)');
    } else if ((state.cards ?? 0) > 0) {
      this.door.setFillStyle(HALL.doorOpen);
      this.doorLabel.setText('GERBANG KARTU · BUKA');
    } else {
      this.door.setFillStyle(HALL.doorClosed);
      this.doorLabel.setText('GERBANG KARTU · PENUH');
    }
  }

  destroy(): void {
    for (const object of this.objects) object.destroy();
    this.objects.length = 0;
  }

  private track<T extends GameObjects.GameObject>(object: T): T {
    this.objects.push(object);
    return object;
  }

  private addZone(
    scene: Scene,
    rect: Rect,
    title: string,
  ): GameObjects.Rectangle {
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
    this.track(
      scene.add
        .text(rect.x + rect.width / 2, rect.y + HALL.zoneTitleInset, title, {
          ...TEXT_STYLE,
          fontSize: HALL.titleFontSize,
        })
        .setOrigin(0.5, 0)
        .setDepth(DEPTH.slot),
    );
    return panel;
  }
}
