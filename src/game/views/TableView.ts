import { GameObjects, Scene } from 'phaser';
import type { Rect, TableLayout } from '../layouts/types';
import type { TableState } from '../tableState';
import { COLORS, DEPTH, HALL, TABLE, TEXT_STYLE } from '../theme';

/**
 * Bagian tetap arena meja barang: tiga zona, angka di meja, lampu sinyal
 * (disertai label teks), penanda tidur (zzz), dan teks status pengepak.
 * Hanya menggambar; semua nilai datang dari TableState.
 */
export class TableView {
  private readonly objects: GameObjects.GameObject[] = [];
  private readonly count: GameObjects.Text;
  private readonly lamp: GameObjects.Arc;
  private readonly lampLabel: GameObjects.Text;
  private readonly zzz: GameObjects.Text;
  private readonly mode: GameObjects.Text;

  constructor(scene: Scene, layout: TableLayout) {
    this.addZone(scene, layout.workZone, 'Area Perakit');
    this.addZone(scene, layout.packZone, 'Area Pengepak');
    this.addZone(scene, layout.table, 'Meja Barang', true);

    const { table } = layout;
    this.count = this.track(
      scene.add
        .text(table.x + table.width / 2, table.y + table.height / 2 + 12, '', {
          ...TEXT_STYLE,
          fontSize: TABLE.countFontSize,
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.slot),
    );

    this.lamp = this.track(
      scene.add
        .circle(layout.lamp.x, layout.lamp.y, TABLE.lampRadius, TABLE.lampRed)
        .setStrokeStyle(TABLE.lampStrokeWidth, TABLE.lampStroke)
        .setDepth(DEPTH.gate),
    );
    this.lampLabel = this.track(
      scene.add
        .text(
          layout.lamp.x,
          layout.lamp.y - TABLE.lampRadius - TABLE.lampLabelGap,
          '',
          { ...TEXT_STYLE, fontSize: TABLE.lampLabelFontSize },
        )
        .setOrigin(0.5, 1)
        .setDepth(DEPTH.gate),
    );

    this.zzz = this.track(
      scene.add
        .text(layout.packerSpot.x, layout.packerSpot.y - TABLE.zzzLift, 'zzz', {
          ...TEXT_STYLE,
          fontSize: TABLE.zzzFontSize,
          color: '#bfdbfe',
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.robotFx)
        .setVisible(false),
    );
    this.mode = this.track(
      scene.add
        .text(layout.battery.x, layout.battery.y + TABLE.modeGap, '', {
          ...TEXT_STYLE,
          fontSize: TABLE.modeFontSize,
        })
        .setOrigin(0.5, 0)
        .setDepth(DEPTH.slot),
    );
  }

  update(state: TableState): void {
    this.count.setText(`barang: ${state.items} / ${state.target}`);
    this.lamp.setFillStyle(state.lampGreen ? TABLE.lampGreen : TABLE.lampRed);
    this.lampLabel.setText(state.lampLabel);
    this.zzz.setVisible(state.packerMode === 'sleeping');
    this.mode.setText(state.modeLabel);
  }

  destroy(): void {
    for (const object of this.objects) object.destroy();
    this.objects.length = 0;
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
          isTable ? TABLE.tableFill : HALL.zoneFill,
          isTable ? 1 : HALL.zoneFillAlpha,
        )
        .setStrokeStyle(
          isTable ? TABLE.tableStrokeWidth : HALL.zoneStrokeWidth,
          isTable ? TABLE.tableStroke : HALL.zoneStroke,
        )
        .setDepth(DEPTH.track),
    );
    this.track(
      scene.add
        .text(rect.x + rect.width / 2, rect.y + TABLE.tableTitleInset, title, {
          ...TEXT_STYLE,
          fontSize: TABLE.titleFontSize,
          color: COLORS.text,
        })
        .setOrigin(0.5, 0)
        .setDepth(DEPTH.slot),
    );
  }
}
