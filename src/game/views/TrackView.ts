import { GameObjects, Scene } from 'phaser';
import { ROAD_CURVE, ROAD_STRAIGHT } from '../assetManifest';
import { pointAt } from '../pathMath';
import type { RoadGeometry, RoadTile } from '../roadGeometry';
import { DEPTH, ROAD } from '../theme';

const ARROW_COUNT = 12;

const textureKeyOf = (tile: RoadTile): string =>
  tile.kind.startsWith('curve') ? ROAD_CURVE.key : ROAD_STRAIGHT.key;

/**
 * Jalan robot dari ubin pixel art (sudut dan lurus) plus panah arah. Bila
 * tekstur belum termuat, jalan digambar sebagai garis tebal (placeholder).
 */
export class TrackView {
  private readonly objects: GameObjects.GameObject[] = [];

  constructor(scene: Scene, road: RoadGeometry) {
    const textured =
      scene.textures.exists(ROAD_STRAIGHT.key) &&
      scene.textures.exists(ROAD_CURVE.key);
    if (textured) this.addTiles(scene, road);
    else this.addFallback(scene, road);
    this.addArrows(scene, road);
  }

  private addTiles(scene: Scene, road: RoadGeometry): void {
    for (const tile of road.tiles) {
      const image = scene.add.image(0, 0, textureKeyOf(tile));
      if (tile.rotate90) {
        // Tekstur lurus (ROAD.unit x ROAD.width) diputar 90 derajat di
        // sekitar pusat kotak ubin tegak (ROAD.width x ROAD.unit).
        image
          .setOrigin(0.5, 0.5)
          .setPosition(tile.x + tile.width / 2, tile.y + tile.height / 2)
          .setAngle(90);
      } else {
        image
          .setOrigin(0, 0)
          .setPosition(tile.x, tile.y)
          .setFlip(tile.flipX, tile.flipY);
      }
      this.objects.push(image.setDepth(DEPTH.track));
    }
  }

  private addFallback(scene: Scene, road: RoadGeometry): void {
    const g = scene.add.graphics();
    const dots = (radius: number, color: number): void => {
      g.fillStyle(color, 1);
      for (const p of road.path.points) g.fillCircle(p.x, p.y, radius);
    };
    dots(ROAD.width / 2 + 3, ROAD.edge);
    dots(ROAD.width / 2, ROAD.color);
    this.objects.push(g.setDepth(DEPTH.track));
  }

  private addArrows(scene: Scene, road: RoadGeometry): void {
    const g = scene.add.graphics();
    g.fillStyle(ROAD.arrow, 0.9);
    for (let k = 0; k < ARROW_COUNT; k++) {
      const p = pointAt(road.path, (k + 0.5) / ARROW_COUNT, 0);
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
    // Sedikit di atas ubin, tetap di bawah sorotan segmen pintu (DEPTH.segment).
    this.objects.push(g.setDepth(DEPTH.track + 0.5));
  }

  destroy(): void {
    for (const object of this.objects) object.destroy();
    this.objects.length = 0;
  }
}
