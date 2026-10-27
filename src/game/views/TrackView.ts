import { GameObjects, Scene } from 'phaser';
import { pointAt, type SampledPath } from '../pathMath';
import { ROAD } from '../theme';

const ARROW_COUNT = 12;

/** Jalan robot: dua lapis garis tebal plus panah arah di tengah jalan. */
export class TrackView {
  private readonly graphics: GameObjects.Graphics;

  constructor(scene: Scene, path: SampledPath) {
    const g = scene.add.graphics();
    const stroke = (width: number, color: number): void => {
      g.lineStyle(width, color, 1);
      for (let i = 1; i < path.points.length; i++) {
        const a = path.points[i - 1];
        const b = path.points[i];
        if (a !== undefined && b !== undefined) {
          g.lineBetween(a.x, a.y, b.x, b.y);
        }
      }
    };
    stroke(ROAD.width + 6, ROAD.edge);
    stroke(ROAD.width, ROAD.color);

    g.fillStyle(ROAD.arrow, 1);
    for (let k = 0; k < ARROW_COUNT; k++) {
      const p = pointAt(path, (k + 0.5) / ARROW_COUNT, 0);
      const dx = Math.cos(p.angle);
      const dy = Math.sin(p.angle);
      g.fillTriangle(
        p.x + dx * 8,
        p.y + dy * 8,
        p.x - dx * 6 - dy * 6,
        p.y - dy * 6 + dx * 6,
        p.x - dx * 6 + dy * 6,
        p.y - dy * 6 - dx * 6,
      );
    }
    this.graphics = g;
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
