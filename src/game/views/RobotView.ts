import { GameObjects, Scene } from 'phaser';
import type { Instruction, ThreadId, ThreadSnapshot } from '../../engine/types';
import {
  COLORS,
  LANE,
  ROBOT_SIZE,
  STATE_STYLE,
  TEXT_STYLE,
  TILE_SIZE,
  TILE_TEXT_STYLE,
  laneCenterY,
  tileCenterX,
} from '../theme';

/**
 * Tampilan satu robot (thread) beserta jalurnya: deretan ubin (satu ubin =
 * satu instruksi), kotak robot yang meluncur di atas ubin, dan label nama +
 * state di sisi kiri jalur. Warna state selalu disertai label teks.
 *
 * Kelas ini hanya menggambar. Ia tidak tahu aturan permainan; posisinya
 * ditentukan oleh `index` instruksi yang diberikan scene dari event engine.
 */
export class RobotView {
  readonly threadId: ThreadId;
  private readonly scene: Scene;
  private readonly tileCount: number;
  private readonly tileObjects: GameObjects.GameObject[] = [];
  private readonly box: GameObjects.Rectangle;
  private readonly caption: GameObjects.Text;

  constructor(
    scene: Scene,
    thread: ThreadSnapshot,
    program: readonly Instruction[],
    laneIndex: number,
  ) {
    this.scene = scene;
    this.threadId = thread.id;
    this.tileCount = program.length;
    const y = laneCenterY(laneIndex);

    // Ubin digambar lebih dulu supaya kotak robot berada di atasnya.
    program.forEach((instruction, index) => {
      const x = tileCenterX(index);
      this.tileObjects.push(
        scene.add
          .rectangle(x, y, TILE_SIZE - 4, TILE_SIZE - 4, COLORS.tile)
          .setStrokeStyle(1, COLORS.tileBorder),
        scene.add
          .text(x, y + TILE_SIZE / 2 - 10, instruction.op, TILE_TEXT_STYLE)
          .setOrigin(0.5),
      );
    });

    this.box = scene.add
      .rectangle(
        tileCenterX(this.clampIndex(thread.pc)),
        y,
        ROBOT_SIZE,
        ROBOT_SIZE,
        STATE_STYLE[thread.state].color,
      )
      .setStrokeStyle(2, COLORS.robotBorder);
    this.caption = scene.add
      .text(LANE.labelX, y, '', TEXT_STYLE)
      .setOrigin(0.5);
    this.update(thread);
  }

  /** Menyesuaikan warna dan label dengan keadaan thread pada snapshot. */
  update(thread: ThreadSnapshot): void {
    const style = STATE_STYLE[thread.state];
    this.box.setFillStyle(style.color);

    // Saat WAITING, tampilkan juga apa yang ditunggu (mis. mutex:pintu).
    const waiting = thread.waitingOn === null ? '' : `\n${thread.waitingOn}`;
    this.caption.setText(`${thread.label}\n${style.label}${waiting}`);
  }

  /**
   * Meluncurkan robot ke ubin `index`. Durasi diberikan scene
   * (tickInterval / speed) agar gerakan selesai sebelum tick berikutnya.
   */
  moveToTile(index: number, durationMs: number): void {
    const x = tileCenterX(this.clampIndex(index));
    this.scene.tweens.killTweensOf(this.box);
    if (durationMs <= 0) {
      this.box.setX(x);
      return;
    }
    this.scene.tweens.add({
      targets: this.box,
      x,
      duration: durationMs,
      ease: 'Linear',
    });
  }

  destroy(): void {
    // Tween yang masih jalan harus dihentikan sebelum targetnya dihapus.
    this.scene.tweens.killTweensOf(this.box);
    this.box.destroy();
    this.caption.destroy();
    for (const object of this.tileObjects) object.destroy();
  }

  /** Menjaga indeks tetap di dalam jalur (program kosong dianggap ubin 0). */
  private clampIndex(index: number): number {
    return Math.max(0, Math.min(index, this.tileCount - 1));
  }
}
