import { GameObjects, Scene } from 'phaser';
import { pointAt, type SampledPath } from '../pathMath';
  import { DEPTH, ROAD } from '../theme';

const ARROW_COUNT = 12;

/** Jalan robot: lingkaran bertumpuk di tiap titik sampel (tepi mulus) plus panah arah. */
export class TrackView {
  private readonly graphics: GameObjects.Graphics;

  constructor(scene: Scene, path: SampledPath) {
    const g = scene.add.graphics();
    const dots = (radius: number, color: number): void => {
      g.fillStyle(color, 1);
      for (const p of path.points) g.fillCircle(p.x, p.y, radius);
    };
    dots(ROAD.width / 2 + 3, ROAD.edge);
    dots(ROAD.width / 2, ROAD.color);

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
    this.graphics = g.setDepth(DEPTH.track);
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
