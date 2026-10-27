import { GameObjects, Scene } from 'phaser';
import type { Point } from '../layouts/types';
import { DEPTH, SLOT_STYLE } from '../theme';

/** Keadaan penanda: slot sah (null = tidak sedang menyeret) dan slot yang disorot. */
export interface SlotMarkerState {
  valid: ReadonlySet<number> | null;
  hover: number | null;
}

/**
 * Penanda slot di celah antar checkpoint. Saat tidak ada alat diseret, semua
 * slot berupa titik pudar. Saat menyeret, slot sah membesar dan berwarna
 * hijau, dan slot yang disorot diberi cincin putih, jadi pembedanya bukan
 * hanya warna. View ini hanya menggambar; slot mana yang sah ditentukan
 * logika murni di luar view.
 */
export class SlotMarkerView {
  private readonly graphics: GameObjects.Graphics;
  private readonly positions: readonly Point[];

  constructor(scene: Scene, positions: readonly Point[]) {
    this.positions = positions;
    this.graphics = scene.add.graphics().setDepth(DEPTH.slot);
    this.setState({ valid: null, hover: null });
  }

  setState(state: SlotMarkerState): void {
    const g = this.graphics;
    g.clear();
    this.positions.forEach((p, index) => {
      const isValid = state.valid !== null && state.valid.has(index);
      if (!isValid) {
        g.fillStyle(SLOT_STYLE.idleColor, SLOT_STYLE.idleAlpha);
        g.fillCircle(p.x, p.y, SLOT_STYLE.radius);
        return;
      }
      const isHover = state.hover === index;
      const scale = isHover ? SLOT_STYLE.hoverScale : SLOT_STYLE.validScale;
      g.fillStyle(SLOT_STYLE.validColor, 1);
      g.fillCircle(p.x, p.y, SLOT_STYLE.radius * scale);
      if (isHover) {
        g.lineStyle(SLOT_STYLE.ringWidth, SLOT_STYLE.hoverColor, 1);
        g.strokeCircle(p.x, p.y, SLOT_STYLE.radius * scale + 4);
      }
    });
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
