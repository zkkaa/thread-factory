import { GameObjects, Scene } from 'phaser';
import type { ThreadId, ThreadSnapshot, ThreadState } from '../../engine/types';
import type { Anchor } from '../anchors';
import { forwardEnd, pointAt, type SampledPath } from '../pathMath';
import {
  COLORS,
  DEPTH,
  LABEL_STYLE,
  ROBOT_FX,
  ROBOT_FX_TEXT,
  ROBOT_SIZE,
  STATE_STYLE,
} from '../theme';
import { REDUCE_MOTION_KEY } from '../registryKeys';
import { deriveRobotFx } from '../robotFx';

export interface RobotViewOptions {
  path: SampledPath;
  /** Jangkar tiap instruksi efektif (dari computeAnchors). */
  anchors: readonly Anchor[];
  /** Geseran tegak lurus jalan (jalur sejajar). */
  laneOffset: number;
  /** -1 = label di atas robot, 1 = di bawah (supaya dua robot tidak bertumpuk). */
  labelSide: -1 | 1;
  /** Jumlah putaran program (ThreadDef.repeat). */
  totalRounds: number;
}

/**
 * Robot: kotak berwarna state di atas jalan, dengan label nama + status,
 * penghitung putaran, waktu tunggu, dan catatan register. Posisinya berupa
 * pecahan panjang jalan; gerak antar jangkar memakai tween yang selalu maju.
 * View ini hanya menggambar; ia tidak tahu aturan permainan.
 */
export class RobotView {
  readonly threadId: ThreadId;
  private readonly scene: Scene;
  private readonly options: RobotViewOptions;
  private readonly box: GameObjects.Rectangle;
  private readonly label: GameObjects.Text;
  private readonly ring: GameObjects.Rectangle;
  private readonly zzz: GameObjects.Text;
  /** Geseran tegak zzz yang dianimasikan tween (melayang). */
  private readonly zzzOffset = { dy: 0 };
  private pos = { x: 0, y: 0 };
  private pulsing = false;
  private floating = false;
  /** Posisi saat ini di jalan; t boleh > 1 selama tween putaran berikutnya. */
  private readonly cursor = { t: 0 };

  constructor(scene: Scene, thread: ThreadSnapshot, options: RobotViewOptions) {
    this.scene = scene;
    this.options = options;
    this.threadId = thread.id;
    this.cursor.t = this.fractionOf(thread.pc);
    const start = this.positionAt(this.cursor.t);

    this.box = scene.add
      .rectangle(
        start.x,
        start.y,
        ROBOT_SIZE,
        ROBOT_SIZE,
        STATE_STYLE[thread.state].color,
      )
      .setStrokeStyle(2, COLORS.robotBorder)
      .setDepth(DEPTH.robot);
    this.label = scene.add
      .text(start.x, start.y, '', LABEL_STYLE)
      .setOrigin(0.5, options.labelSide < 0 ? 1 : 0)
      .setDepth(DEPTH.robotLabel);
    const ringSize = ROBOT_SIZE + ROBOT_FX.glowPadding * 2;
    this.ring = scene.add
      .rectangle(
        start.x,
        start.y,
        ringSize,
        ringSize,
        ROBOT_FX.glowColor,
        ROBOT_FX.glowFillAlpha,
      )
      .setStrokeStyle(ROBOT_FX.glowStroke, ROBOT_FX.glowColor)
      .setDepth(DEPTH.robotGlow)
      .setVisible(false);
    // zzz di sisi yang berlawanan dengan label supaya tidak bertumpuk.
    this.zzz = scene.add
      .text(start.x, start.y, 'zzz', ROBOT_FX_TEXT)
      .setOrigin(0.5, options.labelSide < 0 ? 0 : 1)
      .setDepth(DEPTH.robotFx)
      .setVisible(false);
    this.place(this.cursor.t);
    this.update(thread);
  }

  /** Menyesuaikan warna dan label dengan keadaan thread pada snapshot. */
  update(thread: ThreadSnapshot): void {
    const style = STATE_STYLE[thread.state];
    const { totalRounds } = this.options;
    this.box.setFillStyle(style.color);
    this.applyFx(thread.state);

    const status = thread.state === 'READY' ? 'READY (zzz)' : style.label;
    const round =
      thread.state === 'TERMINATED'
        ? totalRounds
        : Math.min(thread.iteration + 1, totalRounds);
    const notes = Object.entries(thread.registers).map(
      ([name, value]) => `${name} = ${value}`,
    );
    const lines = [
      `${thread.label} · ${status}`,
      `Produk ${round}/${totalRounds} · tunggu ${thread.waitTicks}`,
    ];
    if (thread.waitingOn !== null) lines.push(`menunggu ${thread.waitingOn}`);
    else if (notes.length > 0) lines.push(`catatan: ${notes.join(', ')}`);
    this.label.setText(lines.join('\n'));
  }

  /**
   * Meluncurkan robot ke jangkar instruksi efektif `index`. Selalu maju
   * sepanjang jalan; bila jangkar ada di belakang, robot melewati ujung jalan
   * (putaran berikutnya). Tween lama dihentikan dulu agar tidak saling menimpa.
   */
  moveToInstruction(index: number, durationMs: number): void {
    const target = this.fractionOf(index);
    const from = this.cursor.t - Math.floor(this.cursor.t);
    this.scene.tweens.killTweensOf(this.cursor);
    this.cursor.t = from;
    const end = forwardEnd(from, target);
    if (end === from) return;
    if (durationMs <= 0) {
      this.cursor.t = target;
      this.place(target);
      return;
    }
    this.scene.tweens.add({
      targets: this.cursor,
      t: end,
      duration: durationMs,
      ease: 'Linear',
      onUpdate: () => this.place(this.cursor.t),
    });
  }

  destroy(): void {
    this.scene.tweens.killTweensOf(this.cursor);
    this.scene.tweens.killTweensOf(this.ring);
    this.scene.tweens.killTweensOf(this.zzzOffset);
    this.box.destroy();
    this.label.destroy();
    this.ring.destroy();
    this.zzz.destroy();
  }

  private fractionOf(index: number): number {
    const { anchors } = this.options;
    const clamped = Math.max(0, Math.min(index, anchors.length - 1));
    return anchors[clamped]?.fraction ?? 0;
  }

  private positionAt(fraction: number) {
    return pointAt(this.options.path, fraction, this.options.laneOffset);
  }

  private place(fraction: number): void {
    const p = this.positionAt(fraction);
    this.pos = { x: p.x, y: p.y };
    this.box.setPosition(p.x, p.y);
    this.label.setPosition(
      p.x,
      p.y + this.options.labelSide * (ROBOT_SIZE / 2 + 4),
    );
    this.placeFx();
  }

  private placeFx(): void {
    const { x, y } = this.pos;
    this.ring.setPosition(x, y);
    this.zzz.setPosition(
      x,
      y -
        this.options.labelSide * (ROBOT_SIZE / 2 + ROBOT_FX.zzzGap) +
        this.zzzOffset.dy,
    );
  }

  /** Menerapkan efek Si Penjadwal; membaca "kurangi animasi" dari registry. */
  private applyFx(state: ThreadState): void {
    const reduceMotion = this.scene.registry.get(REDUCE_MOTION_KEY) === true;
    const fx = deriveRobotFx(state, reduceMotion);

    this.box.setAlpha(fx.frozen ? ROBOT_FX.frozenAlpha : 1);
    if (fx.frozen) {
      this.box.setStrokeStyle(ROBOT_FX.iceStroke, ROBOT_FX.iceColor);
    } else {
      this.box.setStrokeStyle(fx.glow ? 4 : 2, COLORS.robotBorder);
    }
    this.ring.setVisible(fx.glow);
    this.zzz.setVisible(fx.frozen);

    if (fx.pulse !== this.pulsing) {
      this.pulsing = fx.pulse;
      this.scene.tweens.killTweensOf(this.ring);
      this.ring.setScale(1);
      if (fx.pulse) {
        this.scene.tweens.add({
          targets: this.ring,
          scale: ROBOT_FX.pulseScale,
          duration: ROBOT_FX.pulseMs,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }

    if (fx.float !== this.floating) {
      this.floating = fx.float;
      this.scene.tweens.killTweensOf(this.zzzOffset);
      this.zzzOffset.dy = 0;
      this.placeFx();
      if (fx.float) {
        this.scene.tweens.add({
          targets: this.zzzOffset,
          dy: -ROBOT_FX.zzzFloat,
          duration: ROBOT_FX.zzzFloatMs,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          onUpdate: () => this.placeFx(),
        });
      }
    }
  }
}
