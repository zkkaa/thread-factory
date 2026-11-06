import { GameObjects, Scene } from 'phaser';
import type { DeskState } from '../deskState';
import type { DeskLayout, Rect } from '../layouts/types';
import { REDUCE_MOTION_KEY } from '../registryKeys';
import { COLORS, DEPTH, DESK, HALL, TEXT_STYLE } from '../theme';

/**
 * Bagian tetap arena meja barang: tiga zona, angka di meja, lampu sinyal
 * (disertai label teks), penanda tidur (zzz, melayang kecuali "kurangi
 * animasi" aktif), dan teks status pengepak. Hanya menggambar; semua nilai
 * datang dari DeskState.
 */
export class DeskView {
  private readonly objects: GameObjects.GameObject[] = [];
  private readonly scene: Scene;
  private readonly count: GameObjects.Text;
  private readonly lamp: GameObjects.Arc;
  private readonly lampLabel: GameObjects.Text;
  private readonly zzz: GameObjects.Text;
  private readonly zzzBaseY: number;
  private readonly mode: GameObjects.Text;
  private floating = false;

  constructor(scene: Scene, layout: DeskLayout) {
    this.scene = scene;
    this.addZone(scene, layout.workZone, 'Area Perakit');
    this.addZone(scene, layout.packZone, 'Area Pengepak');
    this.addZone(scene, layout.table, 'Meja Barang', true);
    const { table } = layout;
    this.count = this.track(
      scene.add
        .text(table.x + table.width / 2, table.y + table.height / 2 + 12, '', {
          ...TEXT_STYLE,
          fontSize: DESK.countFontSize,
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.slot),
    );
    this.lamp = this.track(
      scene.add
        .circle(layout.lamp.x, layout.lamp.y, DESK.lampRadius, DESK.lampRed)
        .setStrokeStyle(DESK.lampStrokeWidth, DESK.lampStroke)
        .setDepth(DEPTH.gate),
    );
    this.lampLabel = this.track(
      scene.add
        .text(
          layout.lamp.x,
          layout.lamp.y - DESK.lampRadius - DESK.lampLabelGap,
          '',
          { ...TEXT_STYLE, fontSize: DESK.lampLabelFontSize },
        )
        .setOrigin(0.5, 1)
        .setDepth(DEPTH.gate),
    );
    this.zzzBaseY = layout.packerSpot.y - DESK.zzzLift;
    this.zzz = this.track(
      scene.add
        .text(layout.packerSpot.x, this.zzzBaseY, 'zzz', {
          ...TEXT_STYLE,
          fontSize: DESK.zzzFontSize,
          color: '#bfdbfe',
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.robotFx)
        .setVisible(false),
    );
    this.mode = this.track(
      scene.add
        .text(layout.battery.x, layout.battery.y + DESK.modeGap, '', {
          ...TEXT_STYLE,
          fontSize: DESK.modeFontSize,
        })
        .setOrigin(0.5, 0)
        .setDepth(DEPTH.slot),
    );
  }

  update(state: DeskState): void {
    this.count.setText(`barang: ${state.items} / ${state.target}`);
    this.lamp.setFillStyle(state.lampGreen ? DESK.lampGreen : DESK.lampRed);
    this.lampLabel.setText(state.lampLabel);
    const sleeping = state.packerMode === 'sleeping';
    this.zzz.setVisible(sleeping);
    const reduceMotion = this.scene.registry.get(REDUCE_MOTION_KEY) === true;
    this.setFloating(sleeping && !reduceMotion);
    this.mode.setText(state.modeLabel);
  }

  destroy(): void {
    this.scene.tweens.killTweensOf(this.zzz);
    for (const object of this.objects) object.destroy();
    this.objects.length = 0;
  }

  /** Menyalakan atau mematikan gerak melayang zzz; hanya bertindak saat berubah. */
  private setFloating(on: boolean): void {
    if (on === this.floating) return;
    this.floating = on;
    this.scene.tweens.killTweensOf(this.zzz);
    this.zzz.setY(this.zzzBaseY);
    if (on) {
      this.scene.tweens.add({
        targets: this.zzz,
        y: this.zzzBaseY - DESK.zzzFloat,
        duration: DESK.zzzFloatMs,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private track<T extends GameObjects.GameObject>(object: T): T {
    this.objects.push(object);
    return object;
  }

  private addZone(scene: Scene, rect: Rect, title: string, isTable = false) {
    this.track(
      scene.add
        .rectangle(
          rect.x + rect.width / 2,
          rect.y + rect.height / 2,
          rect.width,
          rect.height,
          isTable ? DESK.tableFill : HALL.zoneFill,
          isTable ? 1 : HALL.zoneFillAlpha,
        )
        .setStrokeStyle(
          isTable ? DESK.tableStrokeWidth : HALL.zoneStrokeWidth,
          isTable ? DESK.tableStroke : HALL.zoneStroke,
        )
        .setDepth(DEPTH.track),
    );
    this.track(
      scene.add
        .text(rect.x + rect.width / 2, rect.y + DESK.tableTitleInset, title, {
          ...TEXT_STYLE,
          fontSize: DESK.titleFontSize,
          color: COLORS.text,
        })
        .setOrigin(0.5, 0)
        .setDepth(DEPTH.slot),
    );
  }
}