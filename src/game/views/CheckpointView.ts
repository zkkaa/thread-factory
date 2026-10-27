import { GameObjects, Scene } from 'phaser';
import type { Instruction } from '../../engine/types';
import { describeOp } from '../opLabels';
import {
  CHECKPOINT,
  COLORS,
  DEPTH,
  LABEL_STYLE,
  TILE_TEXT_STYLE,
} from '../theme';

/** Checkpoint bulat satu instruksi, dengan tooltip penjelasan awam saat di-hover. */
export class CheckpointView {
  private readonly circle: GameObjects.Arc;
  private readonly label: GameObjects.Text;
  private readonly zone: GameObjects.Zone;
  private readonly tooltip: GameObjects.Text;

  constructor(scene: Scene, x: number, y: number, instruction: Instruction) {
    const info = describeOp(instruction);
    const size = CHECKPOINT.radius * 2;

    this.circle = scene.add
      .circle(x, y, CHECKPOINT.radius, CHECKPOINT.fill)
      .setStrokeStyle(3, CHECKPOINT.stroke);
    this.label = scene.add
      .text(x, y, info.short, { ...TILE_TEXT_STYLE, color: COLORS.text })
      .setOrigin(0.5);
    this.tooltip = scene.add
      .text(x, y - CHECKPOINT.radius - 10, info.description, {
        ...LABEL_STYLE,
        wordWrap: { width: CHECKPOINT.tooltipWidth },
      })
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.tooltip)
      .setVisible(false);

    // Zona persegi agar area hover pasti terdefinisi.
    this.zone = scene.add.zone(x, y, size, size).setInteractive();
    this.zone.on('pointerover', () => {
      this.circle.setStrokeStyle(3, CHECKPOINT.hover);
      this.tooltip.setVisible(true);
    });
    this.zone.on('pointerout', () => {
      this.circle.setStrokeStyle(3, CHECKPOINT.stroke);
      this.tooltip.setVisible(false);
    });
  }

  destroy(): void {
    this.circle.destroy();
    this.label.destroy();
    this.zone.destroy();
    this.tooltip.destroy();
  }
}
