import { GameObjects, Scene } from 'phaser';
import { deriveBatteryLook } from '../batteryMeter';
import { BATTERY_STYLE, DEPTH, TEXT_STYLE } from '../theme';

/**
 * Meter baterai robot (Level 1-4). Hanya menggambar sisa baterai (0..1) yang
 * dihitung engine dari busyWaitTicks; view tidak menghitung apa pun. Bisa
 * dipasang di arena mana pun (layout meja barang menyusul di T-092).
 * Posisi (x, y) adalah titik tengah badan baterai.
 */
export class BatteryMeter {
  private readonly graphics: GameObjects.Graphics;
  private readonly label: GameObjects.Text;
  private x: number;
  private y: number;
  private level = 1;
  /** Kunci gambar terakhir, supaya tidak menggambar ulang tanpa perubahan. */
  private lastKey = '';

  constructor(scene: Scene, x: number, y: number, level = 1) {
    this.x = x;
    this.y = y;
    this.level = level;
    this.graphics = scene.add.graphics().setDepth(DEPTH.battery);
    this.label = scene.add
      .text(0, 0, '', { ...TEXT_STYLE, fontSize: '12px', fontStyle: 'bold' })
      .setOrigin(0, 0.5)
      .setDepth(DEPTH.battery);
    this.redraw();
  }

  /** Memperbarui sisa baterai (0..1). Menggambar ulang hanya bila berubah. */
  update(level: number): void {
    this.level = level;
    this.redraw();
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.lastKey = '';
    this.redraw();
  }

  setVisible(visible: boolean): void {
    this.graphics.setVisible(visible);
    this.label.setVisible(visible);
  }

  destroy(): void {
    this.graphics.destroy();
    this.label.destroy();
  }

  private redraw(): void {
    const look = deriveBatteryLook(this.level);
    const key = `${this.x}|${this.y}|${look.percent}|${look.band}`;
    if (key === this.lastKey) return;
    this.lastKey = key;

    const { width, height, frameStroke, tipWidth, tipHeight } = BATTERY_STYLE;
    const left = this.x - width / 2;
    const top = this.y - height / 2;
    const inner = {
      x: left + frameStroke,
      y: top + frameStroke,
      width: width - frameStroke * 2,
      height: height - frameStroke * 2,
    };

    const g = this.graphics;
    g.clear();
    g.fillStyle(BATTERY_STYLE.backColor, 1);
    g.fillRect(left, top, width, height);
    if (look.fraction > 0) {
      g.fillStyle(look.color, 1);
      g.fillRect(inner.x, inner.y, inner.width * look.fraction, inner.height);
    }
    g.lineStyle(frameStroke, BATTERY_STYLE.frameColor, 1);
    g.strokeRect(left, top, width, height);
    g.fillStyle(BATTERY_STYLE.frameColor, 1);
    g.fillRect(left + width, this.y - tipHeight / 2, tipWidth, tipHeight);

    this.label
      .setText(look.label)
      .setPosition(
        left + width + tipWidth + BATTERY_STYLE.labelGap / 2,
        this.y,
      );
  }
}
