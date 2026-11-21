import { GameObjects, Scene } from 'phaser';
import type { ThreadId, ThreadSnapshot } from '../../engine/types';
import { TINY_FACTORY } from '../assetManifest';
import { REDUCE_MOTION_KEY } from '../registryKeys';
import { deriveRobotFx } from '../robotFx';
import {
  COLORS,
  DEPTH,
  HALL,
  ROBOT_FX,
  ROBOT_SIZE,
  ROBOT_SPRITE,
  STATE_STYLE,
} from '../theme';

export interface LineRobotOptions {
  x: number;
  y: number;
  spriteFrame: number;
}

/**
 * Robot pada lajur lurus: pelat berwarna state, sprite, dan cincin RUNNING.
 * Tanpa label (nama dan status ada di kartu lajur). Hanya bergerak pada
 * sumbu x. View ini hanya menggambar.
 */
export class LineRobotView {
  readonly threadId: ThreadId;
  private readonly scene: Scene;
  private readonly y: number;
  private readonly box: GameObjects.Rectangle;
  private readonly sprite: GameObjects.Image | null;
  private readonly ring: GameObjects.Rectangle;
  private readonly pos: { x: number };

  constructor(scene: Scene, thread: ThreadSnapshot, options: LineRobotOptions) {
    this.scene = scene;
    this.threadId = thread.id;
    this.y = options.y;
    this.pos = { x: options.x };

    const hasSprite = scene.textures.exists(TINY_FACTORY.key);
    const plate = hasSprite
      ? ROBOT_SIZE + ROBOT_SPRITE.platePadding * 2
      : ROBOT_SIZE;
    this.box = scene.add
      .rectangle(options.x, options.y, plate, plate, 0x9ca3af)
      .setStrokeStyle(HALL.robotStroke, COLORS.robotBorder)
      .setDepth(DEPTH.robot);
    this.sprite = hasSprite
      ? scene.add
          .image(options.x, options.y, TINY_FACTORY.key, options.spriteFrame)
          .setDisplaySize(ROBOT_SIZE, ROBOT_SIZE)
          .setDepth(DEPTH.robotSprite)
      : null;
    const ringSize = ROBOT_SIZE + ROBOT_FX.glowPadding * 2;
    this.ring = scene.add
      .rectangle(
        options.x,
        options.y,
        ringSize,
        ringSize,
        ROBOT_FX.glowColor,
        ROBOT_FX.glowFillAlpha,
      )
      .setStrokeStyle(ROBOT_FX.glowStroke, ROBOT_FX.glowColor)
      .setDepth(DEPTH.robotGlow)
      .setVisible(false);
    this.update(thread);
  }

  update(thread: ThreadSnapshot): void {
    const reduceMotion = this.scene.registry.get(REDUCE_MOTION_KEY) === true;
    const fx = deriveRobotFx(thread.state, reduceMotion);
    const alpha = fx.frozen ? ROBOT_FX.frozenAlpha : 1;
    this.box.setFillStyle(STATE_STYLE[thread.state].color).setAlpha(alpha);
    this.sprite?.setAlpha(alpha);
    this.box.setStrokeStyle(
      fx.frozen ? ROBOT_FX.iceStroke : fx.glow ? 4 : HALL.robotStroke,
      fx.frozen ? ROBOT_FX.iceColor : COLORS.robotBorder,
    );
    this.ring.setVisible(fx.glow);
  }

  /** Maju ke x dengan tween; bergerak mundur (putaran baru) langsung dipindah. */
  moveTo(x: number, durationMs: number): void {
    if (x === this.pos.x) return;
    this.scene.tweens.killTweensOf(this.pos);
    if (durationMs <= 0 || x < this.pos.x) {
      this.place(x);
      return;
    }
    this.scene.tweens.add({
      targets: this.pos,
      x,
      duration: durationMs,
      ease: 'Linear',
      onUpdate: () => this.place(this.pos.x),
    });
  }

  destroy(): void {
    this.scene.tweens.killTweensOf(this.pos);
    this.box.destroy();
    this.sprite?.destroy();
    this.ring.destroy();
  }

  private place(x: number): void {
    this.pos.x = x;
    this.box.setPosition(x, this.y);
    this.sprite?.setPosition(x, this.y);
    this.ring.setPosition(x, this.y);
  }
}