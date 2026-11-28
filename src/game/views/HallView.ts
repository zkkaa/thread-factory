import { GameObjects, Scene } from 'phaser';
import { HALL_ART } from '../assetManifest';
import type { GateDropState } from '../gateDrag';
import type { HallLayout, Rect } from '../layouts/types';
import { ARENA, COLORS, DEPTH, HALL, HALL_LAMP, TEXT_STYLE } from '../theme';

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
 * Bagian tetap arena aula. Ada dua mode, dipilih otomatis:
 * - polos: zona (kerja, antrean, aula, selesai), pintu, mesin, hitungan
 *   "Aula: n / kapasitas", dan spanduk BENTROK, semuanya digambar kode;
 * - bergambar (layout punya `art` dan teksturnya termuat): latar, kolom
 *   pijakan, dan gerbang berupa gambar; panel zona tidak digambar. Gerbang
 *   hanya tampil setelah Kartu Akses dipasang, dan tiga lampunya menyala
 *   sesuai jumlah kartu yang tersisa (maksimal tiga).
 * Warna selalu disertai teks. View ini hanya menggambar; bentrok ditentukan
 * engine (areaOccupancy).
 */
export class HallView {
  private readonly objects: GameObjects.GameObject[] = [];
  private readonly gated: boolean;
  private readonly artMode: boolean;
  private readonly hallPanel: GameObjects.Rectangle;
  private readonly counter: GameObjects.Text;
  private readonly banner: GameObjects.Text;
  private readonly door: GameObjects.Rectangle;
  private readonly doorLabel: GameObjects.Text;
  private readonly dropRing: GameObjects.Arc;
  private readonly dropLabel: GameObjects.Text;
  private readonly lamps: GameObjects.Arc[] = [];
  private readonly machines: {
    box: GameObjects.Rectangle;
    label: GameObjects.Text;
  }[] = [];

  constructor(scene: Scene, layout: HallLayout, gated: boolean) {
    this.gated = gated;
    const textures = scene.textures;
    const art =
      layout.art !== undefined &&
      textures.exists(HALL_ART.background.key) &&
      textures.exists(HALL_ART.column.key) &&
      textures.exists(HALL_ART.gate.key)
        ? layout.art
        : undefined;
    this.artMode = art !== undefined;

    if (art !== undefined) {
      // Latar gambar menutupi lantai polos di bawahnya (depth lantai = DEPTH.floor).
      this.track(
        scene.add
          .image(0, 0, HALL_ART.background.key)
          .setOrigin(0, 0)
          .setDisplaySize(ARENA.width, ARENA.height)
          .setDepth(DEPTH.floor + 1),
      );
      this.track(
        scene.add
          .image(art.column.x, art.column.y, HALL_ART.column.key)
          .setOrigin(0, 0)
          .setScale(art.column.scale)
          .setDepth(DEPTH.track),
      );
      this.hallPanel = this.addOverlay(scene, layout.hall);
      this.addTitle(scene, layout.doneZone, 'Selesai');
    } else {
      this.addZone(scene, layout.workZone, 'Area Kerja');
      this.addZone(
        scene,
        layout.queueZone,
        gated ? 'Antrean Kartu' : 'Menuju Aula',
      );
      this.hallPanel = this.addZone(scene, layout.hall, 'Aula Mesin');
      this.addZone(scene, layout.doneZone, 'Selesai');
    }

    const centerX = layout.hall.x + layout.hall.width / 2;
    // Di mode gambar bingkai Area Kerja kecil: hitungan dan spanduk di atasnya.
    this.counter = this.track(
      (art !== undefined
        ? scene.add.text(centerX, layout.hall.y - 6, '', {
            ...TEXT_STYLE,
            fontSize: HALL.counterFontSize,
          })
        : scene.add.text(centerX, layout.hall.y + HALL.counterInset, '', {
            ...TEXT_STYLE,
            fontSize: HALL.counterFontSize,
          })
      )
        .setOrigin(0.5, art !== undefined ? 1 : 0)
        .setDepth(DEPTH.slot),
    );
    this.banner = this.track(
      scene.add
        .text(
          centerX,
          layout.hall.y - HALL.bannerGap - (art !== undefined ? 28 : 0),
          '',
          {
            ...TEXT_STYLE,
            fontSize: HALL.bannerFontSize,
            color: HALL.overloadText,
          },
        )
        .setOrigin(0.5, 1)
        .setDepth(DEPTH.robotFx)
        .setVisible(false),
    );

    const machineSize = art?.machineSize ?? HALL.machineSize;
    layout.machines.forEach((p, index) => {
      const box = this.track(
        scene.add
          .rectangle(p.x, p.y, machineSize, machineSize, HALL.machineIdle)
          .setStrokeStyle(HALL.machineStrokeWidth, HALL.machineStroke)
          .setDepth(DEPTH.segment),
      );
      const label = this.track(
        scene.add
          .text(
            p.x,
            p.y - machineSize / 2 - HALL.machineLabelGap,
            this.machineText(index, false),
            { ...TEXT_STYLE, fontSize: HALL.machineFontSize },
          )
          .setOrigin(0.5, 1)
          .setDepth(DEPTH.slot),
      );
      this.machines.push({ box, label });
    });

    // Pintu polos hanya di mode polos; di mode gambar diganti sprite gerbang.
    this.door = this.track(
      scene.add
        .rectangle(
          layout.door.x,
          layout.door.y,
          HALL.doorThickness,
          HALL.doorLength,
          HALL.doorFree,
        )
        .setDepth(DEPTH.gate)
        .setVisible(art === undefined),
    );
    this.doorLabel = this.track(
      scene.add
        .text(
          layout.door.x,
          art !== undefined
            ? art.gate.y - 6
            : layout.door.y - HALL.doorLength / 2 - HALL.doorLabelGap,
          '',
          { ...TEXT_STYLE, fontSize: HALL.doorLabelFontSize },
        )
        .setOrigin(0.5, 1)
        .setDepth(DEPTH.gate),
    );

    if (art !== undefined) {
      // Gerbang dan lampu hanya ada bila Kartu Akses terpasang.
      this.track(
        scene.add
          .image(art.gate.x, art.gate.y, HALL_ART.gate.key)
          .setOrigin(0, 0)
          .setScale(art.gate.scale)
          .setDepth(DEPTH.gate)
          .setVisible(gated),
      );
      for (const p of art.gate.lamps) {
        this.lamps.push(
          this.track(
            scene.add
              .circle(p.x, p.y, art.gate.lampRadius, HALL_LAMP.off)
              .setStrokeStyle(HALL_LAMP.strokeWidth, HALL_LAMP.stroke)
              .setDepth(DEPTH.lock)
              .setVisible(gated),
          ),
        );
      }
    }

    // Sasaran lepas Kartu Akses di pintu aula; hanya tampil saat kartu diseret.
    this.dropRing = this.track(
      scene.add
        .circle(
          layout.door.x,
          layout.door.y,
          HALL.doorDropRadius,
          HALL.dropReady,
          0,
        )
        .setStrokeStyle(HALL.dropStrokeWidth, HALL.dropReady)
        .setDepth(DEPTH.robotFx)
        .setVisible(false),
    );
    this.dropLabel = this.track(
      scene.add
        .text(
          layout.door.x,
          layout.door.y + HALL.doorDropRadius + HALL.doorLabelGap,
          '',
          {
            ...TEXT_STYLE,
            fontSize: HALL.doorLabelFontSize,
            color: HALL.dropText,
          },
        )
        .setOrigin(0.5, 0)
        .setDepth(DEPTH.robotFx)
        .setVisible(false),
    );
  }

  update(state: HallViewState): void {
    const overload = state.occupancy > state.capacity;
    this.counter
      .setText(`Aula: ${state.occupancy} / ${state.capacity}`)
      .setColor(overload ? HALL.overloadText : COLORS.text);

    if (this.artMode) {
      // Bingkai gambar: hanya disorot merah saat bentrok.
      this.hallPanel.setFillStyle(
        HALL.overloadColor,
        overload ? HALL.overloadFillAlpha : 0,
      );
      if (overload) {
        this.hallPanel.setStrokeStyle(
          HALL.overloadStrokeWidth,
          HALL.overloadColor,
        );
      } else {
        this.hallPanel.setStrokeStyle();
      }
    } else {
      this.hallPanel
        .setStrokeStyle(
          overload ? HALL.overloadStrokeWidth : HALL.zoneStrokeWidth,
          overload ? HALL.overloadColor : HALL.zoneStroke,
        )
        .setFillStyle(
          overload ? HALL.overloadColor : HALL.zoneFill,
          overload ? HALL.overloadFillAlpha : HALL.zoneFillAlpha,
        );
    }
    this.banner
      .setText(`BENTROK! ${state.occupancy} robot, kapasitas ${state.capacity}`)
      .setVisible(overload);

    this.machines.forEach((machine, index) => {
      const active = state.activeMachines.has(index);
      machine.box.setFillStyle(active ? HALL.machineActive : HALL.machineIdle);
      machine.label.setText(this.machineText(index, active));
    });

    // Lampu gerbang: satu lampu per kartu yang tersisa, paling banyak tiga.
    const lit = Math.max(0, Math.min(state.cards ?? 0, this.lamps.length));
    this.lamps.forEach((lamp, index) => {
      lamp.setFillStyle(index < lit ? HALL_LAMP.on : HALL_LAMP.off);
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

  /**
   * Menyorot pintu aula sebagai sasaran lepas saat Kartu Akses diseret.
   * Teks selalu menyertai warna: "LEPAS KARTU DI SINI" lalu "LEPAS SEKARANG".
   */
  setDropState(state: GateDropState): void {
    const visible = state !== 'off';
    this.dropRing.setVisible(visible);
    this.dropLabel.setVisible(visible);
    if (!visible) return;
    const over = state === 'over';
    this.dropRing.setFillStyle(
      HALL.dropReady,
      over ? HALL.dropOverAlpha : HALL.dropReadyAlpha,
    );
    this.dropRing.setStrokeStyle(
      HALL.dropStrokeWidth,
      over ? HALL.dropOver : HALL.dropReady,
    );
    this.dropLabel.setText(over ? 'LEPAS SEKARANG' : 'LEPAS KARTU DI SINI');
  }

  destroy(): void {
    for (const object of this.objects) object.destroy();
    this.objects.length = 0;
  }

  /** Mode gambar memakai label ringkas karena mesin hanya berjarak puluhan piksel. */
  private machineText(index: number, active: boolean): string {
    if (this.artMode) return `M${index + 1}`;
    return active ? `Mesin ${index + 1} · aktif` : `Mesin ${index + 1}`;
  }

  private track<T extends GameObjects.GameObject>(object: T): T {
    this.objects.push(object);
    return object;
  }

  /** Persegi bening di atas bingkai gambar; hanya menyala merah saat bentrok. */
  private addOverlay(scene: Scene, rect: Rect): GameObjects.Rectangle {
    return this.track(
      scene.add
        .rectangle(
          rect.x + rect.width / 2,
          rect.y + rect.height / 2,
          rect.width,
          rect.height,
          HALL.overloadColor,
          0,
        )
        .setDepth(DEPTH.track),
    );
  }

  private addTitle(scene: Scene, rect: Rect, title: string): void {
    this.track(
      scene.add
        .text(rect.x + rect.width / 2, rect.y + HALL.zoneTitleInset, title, {
          ...TEXT_STYLE,
          fontSize: HALL.titleFontSize,
        })
        .setOrigin(0.5, 0)
        .setDepth(DEPTH.slot),
    );
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
    this.addTitle(scene, rect, title);
    return panel;
  }
}