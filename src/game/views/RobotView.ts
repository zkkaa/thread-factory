import { GameObjects, Scene } from 'phaser';
import type { ThreadId, ThreadSnapshot } from '../../engine/types';
import type { Anchor } from '../anchors';
import { forwardEnd, pointAt, type SampledPath } from '../pathMath';
import { COLORS, LABEL_STYLE, DEPTH, ROBOT_SIZE, STATE_STYLE } from '../theme';

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
    this.place(this.cursor.t);
    this.update(thread);
  }

  /** Menyesuaikan warna dan label dengan keadaan thread pada snapshot. */
  update(thread: ThreadSnapshot): void {
    const style = STATE_STYLE[thread.state];
    const { totalRounds } = this.options;
    this.box.setFillStyle(style.color);
    this.box.setStrokeStyle(
      thread.state === 'RUNNING' ? 4 : 2,
      COLORS.robotBorder,
    );
    // Si Penjadwal: READY "dibekukan" (pudar), RUNNING menyala (garis tebal).
    this.box.setAlpha(thread.state === 'READY' ? 0.55 : 1);

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
    this.box.destroy();
    this.label.destroy();
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
    this.box.setPosition(p.x, p.y);
    this.label.setPosition(
      p.x,
      p.y + this.options.labelSide * (ROBOT_SIZE / 2 + 4),
    );
  }
}
