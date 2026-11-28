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
  /** Label satu baris (id robot) di atas robot, untuk arena yang rapat. */
  compactLabel?: boolean;
}

/** Fade di bawah ini (ms) dilewati: robot langsung pindah. */
const MIN_FADE_MS = 120;

/** Titik pada garis patah `points` di pecahan panjang `t` (0..1). */
function pointAlong(points: readonly Point[], t: number): Point {
  const first = points[0];
  if (first === undefined) return { x: 0, y: 0 };
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    if (a !== undefined && b !== undefined) {
      total += Math.hypot(b.x - a.x, b.y - a.y);
    }
  }
  if (total === 0) return { ...first };
  let remaining = Math.min(Math.max(t, 0), 1) * total;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    if (a === undefined || b === undefined) continue;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (remaining <= length && length > 0) {
      const u = remaining / length;
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
    }
    remaining -= length;
  }
  const last = points[points.length - 1];
  return last === undefined ? { ...first } : { ...last };
}

/**
 * Robot di arena aula: pelat berwarna state, sprite, dan label. Berpindah
 * lurus (moveTo), berjalan lewat titik rute (walk), atau memudar lalu muncul
 * di tujuan (respawn). View ini hanya menggambar. Tanpa tekstur sprite,
 * hanya pelat yang tampil (placeholder).
 */
export class HallRobotView {
  readonly threadId: ThreadId;
  private readonly scene: Scene;
  private readonly totalRounds: number;
  private readonly compactLabel: boolean;
  private readonly box: GameObjects.Rectangle;
  private readonly sprite: GameObjects.Image | null;
  private readonly label: GameObjects.Text;
  private readonly ring: GameObjects.Rectangle;
  private readonly labelOffset: number;
  /** Posisi saat ini; dianimasikan tween. */
  private readonly pos: Point;
  /** Pecahan perjalanan walk (0..1), dianimasikan tween. */
  private readonly progress = { t: 0 };
  /** Kekeruhan fade respawn (0..1), dianimasikan tween. */
  private readonly fade = { a: 1 };
  private fading = false;
  /** Alpha dasar menurut state (READY dibekukan = pudar). */
  private baseAlpha = 1;
  

  constructor(scene: Scene, thread: ThreadSnapshot, options: HallRobotOptions) {
    this.scene = scene;
    this.threadId = thread.id;
    this.totalRounds = options.totalRounds;
    this.compactLabel = options.compactLabel ?? false;
    this.pos = { ...options.start };
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
      .setOrigin(0.5, this.compactLabel ? 1 : 0)
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
    this.baseAlpha = fx.frozen ? ROBOT_FX.frozenAlpha : 1;
    // Selama fade respawn, alpha dipegang tween, bukan update().
    if (!this.fading) this.applyAlpha(1);
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

    if (this.compactLabel) {
      this.label.setText(overflow ? `${thread.id}!` : thread.id);
      return;
    }
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

  /** Berpindah lurus ke `point` dalam `durationMs`; gerak lama dihentikan dulu. */
  moveTo(point: Point, durationMs: number): void {
    this.walk([point], durationMs);
  }

  /**
   * Berjalan dari posisi sekarang lewat `points` (titik terakhir = tujuan),
   * dengan total durasi `durationMs`. Gerak lama dihentikan dulu.
   */
  walk(points: readonly Point[], durationMs: number): void {
    const end = points[points.length - 1];
    if (end === undefined) return;
    this.cancelMotion();
    if (durationMs <= 0) {
      this.place(end.x, end.y);
      return;
    }
    const path: Point[] = [{ ...this.pos }, ...points];
    this.progress.t = 0;
    this.scene.tweens.add({
      targets: this.progress,
      t: 1,
      duration: durationMs,
      ease: 'Linear',
      onUpdate: () => {
        const p = pointAlong(path, this.progress.t);
        this.place(p.x, p.y);
      },
    });
  }

  /**
   * Memudar, pindah ke `point`, lalu muncul lagi. Dilewati (langsung pindah)
   * bila "kurangi animasi" aktif atau durasi terlalu pendek.
   */
  respawn(point: Point, durationMs: number): void {
    this.cancelMotion();
    const reduceMotion = this.scene.registry.get(REDUCE_MOTION_KEY) === true;
    if (reduceMotion || durationMs < MIN_FADE_MS) {
      this.place(point.x, point.y);
      return;
    }
    const half = durationMs / 2;
    this.fading = true;
    this.fade.a = 1;
    this.scene.tweens.add({
      targets: this.fade,
      a: 0,
      duration: half,
      onUpdate: () => this.applyAlpha(this.fade.a),
      onComplete: () => {
        this.place(point.x, point.y);
        this.scene.tweens.add({
          targets: this.fade,
          a: 1,
          duration: half,
          onUpdate: () => this.applyAlpha(this.fade.a),
          onComplete: () => this.endFade(),
        });
      },
    });
  }

  destroy(): void {
    this.scene.tweens.killTweensOf(this.progress);
    this.scene.tweens.killTweensOf(this.fade);
    this.box.destroy();
    this.sprite?.destroy();
    this.label.destroy();
    this.ring.destroy();
  }

  /** Menghentikan semua gerak dan mengembalikan alpha normal. */
  private cancelMotion(): void {
    this.scene.tweens.killTweensOf(this.progress);
    this.scene.tweens.killTweensOf(this.fade);
    if (this.fading) this.endFade();
  }

  private endFade(): void {
    this.fading = false;
    this.fade.a = 1;
    this.applyAlpha(1);
  }

  /** Alpha akhir = alpha dasar state x faktor fade. */
  private applyAlpha(factor: number): void {
    const alpha = this.baseAlpha * factor;
    this.box.setAlpha(alpha);
    this.sprite?.setAlpha(alpha);
    this.label.setAlpha(factor);
    this.ring.setAlpha(factor);
  }

  private place(x: number, y: number): void {
    this.pos.x = x;
    this.pos.y = y;
    this.box.setPosition(x, y);
    this.sprite?.setPosition(x, y);
    this.ring.setPosition(x, y);
    this.label.setPosition(
      x,
      this.compactLabel ? y - this.labelOffset : y + this.labelOffset,
    );
  }
}