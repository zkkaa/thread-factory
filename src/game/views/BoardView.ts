import { GameObjects, Scene } from 'phaser';
import { BOARD_STYLE, MOTION, TEXT_STYLE } from '../theme';
import { TINY_FACTORY, TINY_FRAMES } from '../assetManifest';

export interface BoardRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Ujung tautan di checkpoint (READ atau WRITE) yang terhubung ke papan. */
export interface BoardLinkPoint {
  x: number;
  y: number;
  direction: 'read' | 'write';
}

const LINK_BASE_ALPHA = 0.35;

/**
 * Papan Stok di tengah arena. Garis tautan ke checkpoint READ/WRITE berkedip
 * saat instruksinya dijalankan (pulse), dan angka membesar sebentar saat
 * berubah. Nilai selalu dari snapshot; view tidak menghitung apa pun.
 */
export class BoardView {
  private readonly scene: Scene;
  private readonly panel: GameObjects.Rectangle;
  private readonly title: GameObjects.Text;
  private readonly valueText: GameObjects.Text;
  private readonly crates: GameObjects.Image[] = [];
  private readonly links: {
    direction: 'read' | 'write';
    graphics: GameObjects.Graphics;
  }[];
  private lastText = '';

  constructor(
    scene: Scene,
    rect: BoardRect,
    sharedVars: Readonly<Record<string, number>>,
    links: readonly BoardLinkPoint[],
  ) {
    this.scene = scene;
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;

    // Garis digambar lebih dulu supaya panel menutup ujungnya di tengah.
    this.links = links.map((link) => {
      const g = scene.add.graphics();
      g.lineStyle(4, BOARD_STYLE.link, 1);
      g.lineBetween(cx, cy, link.x, link.y);

      // Panah arrowOffset dari checkpoint: write menuju papan, read menuju checkpoint.
      const len = Math.hypot(cx - link.x, cy - link.y) || 1;
      const ux = (cx - link.x) / len;
      const uy = (cy - link.y) / len;
      const ax = link.x + ux * BOARD_STYLE.arrowOffset;
      const ay = link.y + uy * BOARD_STYLE.arrowOffset;
      const sign = link.direction === 'write' ? 1 : -1;
      const tx = ux * sign;
      const ty = uy * sign;
      g.fillStyle(BOARD_STYLE.link, 1);
      g.fillTriangle(
        ax + tx * 9,
        ay + ty * 9,
        ax - tx * 6 - ty * 7,
        ay - ty * 6 + tx * 7,
        ax - tx * 6 + ty * 7,
        ay - ty * 6 - tx * 7,
      );
      g.setAlpha(LINK_BASE_ALPHA);
      return { direction: link.direction, graphics: g };
    });

    this.panel = scene.add
      .rectangle(cx, cy, rect.width, rect.height, BOARD_STYLE.fill)
      .setStrokeStyle(3, BOARD_STYLE.stroke);
    this.title = scene.add
      .text(cx, rect.y + 18, 'Papan Stok', { ...TEXT_STYLE, fontSize: '18px' })
      .setOrigin(0.5);
    this.valueText = scene.add
      .text(cx, cy + 12, '', { ...TEXT_STYLE, fontSize: '28px' })
      .setOrigin(0.5);
    // Ikon peti di kedua sisi angka sebagai penanda "stok"; hanya bila aset termuat.
    if (scene.textures.exists(TINY_FACTORY.key)) {
      for (const side of [-1, 1]) {
        this.crates.push(
          scene.add
            .image(
              cx + side * (rect.width / 2 - BOARD_STYLE.crateInset),
              cy + BOARD_STYLE.crateDrop,
              TINY_FACTORY.key,
              TINY_FRAMES.crate,
            )
            .setDisplaySize(BOARD_STYLE.crateSize, BOARD_STYLE.crateSize),
        );
      }
    }
    this.update(sharedVars);
  }

  /** Memperbarui angka; membesar sebentar bila nilainya berubah. */
  update(sharedVars: Readonly<Record<string, number>>): void {
    const text = Object.entries(sharedVars)
      .map(([name, value]) => `${name}: ${value}`)
      .join('   ');
    const changed = this.lastText !== '' && text !== this.lastText;
    this.lastText = text;
    this.valueText.setText(text);
    if (changed) {
      this.scene.tweens.killTweensOf(this.valueText);
      this.valueText.setScale(1);
      this.scene.tweens.add({
        targets: this.valueText,
        scale: BOARD_STYLE.popScale,
        duration: MOTION.popMs,
        yoyo: true,
      });
    }
  }

  /** Mengedipkan tautan READ atau WRITE (panah aliran nilai). */
  pulse(direction: 'read' | 'write', durationMs: number): void {
    for (const link of this.links) {
      if (link.direction !== direction) continue;
      this.scene.tweens.killTweensOf(link.graphics);
      link.graphics.setAlpha(1);
      this.scene.tweens.add({
        targets: link.graphics,
        alpha: LINK_BASE_ALPHA,
        duration: Math.max(durationMs, MOTION.minPulseMs),
      });
    }
  }

  destroy(): void {
    for (const link of this.links) {
      this.scene.tweens.killTweensOf(link.graphics);
      link.graphics.destroy();
    }
    this.scene.tweens.killTweensOf(this.valueText);
    this.panel.destroy();
    this.title.destroy();
    this.valueText.destroy();
    for (const crate of this.crates) crate.destroy();
  }
}
