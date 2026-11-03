import { GameObjects, Scene } from 'phaser';
import type { ThreadId, ThreadSnapshot } from '../../engine/types';
import { TINY_FACTORY } from '../assetManifest';
import type { Point } from '../layouts/types';
import { REDUCE_MOTION_KEY } from '../registryKeys';
import { deriveRobotFx } from '../robotFx';
import {
  COLORS,
  DEPTH,
  HALL,
  LABEL_STYLE,
  ROBOT_FX,
  ROBOT_SIZE,
  ROBOT_SPRITE,
  STATE_STYLE,
} from '../theme';

export interface HallRobotOptions {
  start: Point;
  /** Nomor frame sprite robot pada spritesheet TINY_FACTORY. */
  spriteFrame: number;
  /** Jumlah putaran program (ThreadDef.repeat). */
  totalRounds: number;
}

/**
 * Robot di arena aula: pelat berwarna state, sprite, dan label ringkas
 * (nama, state, putaran). Tidak berjalan di jalan; ia hanya berpindah ke titik
 * yang dipilih hallSpots.ts. View ini hanya menggambar. Tanpa tekstur sprite,
 * hanya pelat yang tampil (placeholder).
 */
export class HallRobotView {
  readonly threadId: ThreadId;
  private readonly scene: Scene;
  private readonly totalRounds: number;
  private readonly box: GameObjects.Rectangle;
  private readonly sprite: GameObjects.Image | null;
  private readonly label: GameObjects.Text;
  private readonly ring: GameObjects.Rectangle;
  private readonly labelOffset: number;
  /** Posisi saat ini; dianimasikan tween. */
  private readonly pos: Point;
  private target: Point;

  constructor(scene: Scene, thread: ThreadSnapshot, options: HallRobotOptions) {
    this.scene = scene;
    this.threadId = thread.id;
    this.totalRounds = options.totalRounds;
    this.pos = { ...options.start };
    this.target = { ...options.start };
    const { x, y } = options.start;

    const hasSprite = scene.textures.exists(TINY_FACTORY.key);
    const plateSize = hasSprite
      ? ROBOT_SIZE + ROBOT_SPRITE.platePadding * 2
      : ROBOT_SIZE;
    this.labelOffset = plateSize / 2 + HALL.robotLabelGap;

    this.box = scene.add
      .rectangle(x, y, plateSize, plateSize, STATE_STYLE[thread.state].color)
      .setStrokeStyle(HALL.robotStroke, COLORS.robotBorder)
      .setDepth(DEPTH.robot);
    this.sprite = hasSprite
      ? scene.add
          .image(x, y, TINY_FACTORY.key, options.spriteFrame)
          .setDisplaySize(ROBOT_SIZE, ROBOT_SIZE)
          .setDepth(DEPTH.robotSprite)
      : null;
    this.label = scene.add
      .text(x, y, '', { ...LABEL_STYLE, fontSize: HALL.robotLabelFontSize })
      .setOrigin(0.5, 0)
      .setDepth(DEPTH.robotLabel);
    const ringSize = ROBOT_SIZE + ROBOT_FX.glowPadding * 2;
    this.ring = scene.add
      .rectangle(
        x,
        y,
        ringSize,
        ringSize,
        ROBOT_FX.glowColor,
        ROBOT_FX.glowFillAlpha,
      )
      .setStrokeStyle(ROBOT_FX.glowStroke, ROBOT_FX.glowColor)
      .setDepth(DEPTH.robotGlow)
      .setVisible(false);

    this.place(x, y);
    this.update(thread, false);
  }

  /**
   * Menyesuaikan warna, efek Si Penjadwal, dan label dengan keadaan thread.
   * `overflow` = robot menempati kursi luapan (aula kelebihan kapasitas): diberi
   * garis tepi merah dan baris teks BENTROK, jadi tidak hanya warna.
   */
  update(thread: ThreadSnapshot, overflow: boolean): void {
    const style = STATE_STYLE[thread.state];
    const reduceMotion = this.scene.registry.get(REDUCE_MOTION_KEY) === true;
    const fx = deriveRobotFx(thread.state, reduceMotion);

    this.box.setFillStyle(style.color);
    const alpha = fx.frozen ? ROBOT_FX.frozenAlpha : 1;
    this.box.setAlpha(alpha);
    this.sprite?.setAlpha(alpha);
    if (overflow) {
      this.box.setStrokeStyle(HALL.overloadStrokeWidth, HALL.overloadColor);
    } else if (fx.frozen) {
      this.box.setStrokeStyle(ROBOT_FX.iceStroke, ROBOT_FX.iceColor);
    } else {
      this.box.setStrokeStyle(
        fx.glow ? HALL.robotGlowStroke : HALL.robotStroke,
        COLORS.robotBorder,
      );
    }
    this.ring.setVisible(fx.glow);

    const round =
      thread.state === 'TERMINATED'
        ? this.totalRounds
        : Math.min(thread.iteration + 1, this.totalRounds);
    const lines = [
      thread.label,
      style.label,
      `Putaran ${round}/${this.totalRounds}`,
    ];
    if (overflow) lines.push('BENTROK');
    this.label.setText(lines.join('\n'));
  }

  /** Berpindah ke `point` dalam `durationMs`; tween lama dihentikan dulu. */
  moveTo(point: Point, durationMs: number): void {
    if (this.target.x === point.x && this.target.y === point.y) return;
    this.target = { ...point };
    this.scene.tweens.killTweensOf(this.pos);
    if (durationMs <= 0) {
      this.place(point.x, point.y);
      return;
    }
    this.scene.tweens.add({
      targets: this.pos,
      x: point.x,
      y: point.y,
      duration: durationMs,
      ease: 'Linear',
      onUpdate: () => this.place(this.pos.x, this.pos.y),
    });
  }

  destroy(): void {
    this.scene.tweens.killTweensOf(this.pos);
    this.box.destroy();
    this.sprite?.destroy();
    this.label.destroy();
    this.ring.destroy();
  }

  private place(x: number, y: number): void {
    this.pos.x = x;
    this.pos.y = y;
    this.box.setPosition(x, y);
    this.sprite?.setPosition(x, y);
    this.ring.setPosition(x, y);
    this.label.setPosition(x, y + this.labelOffset);
  }
}
