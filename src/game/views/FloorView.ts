import { GameObjects, Scene } from 'phaser';
import { FLOOR_TEXTURE_KEY, TINY_FACTORY } from '../assetManifest';
import { floorFrameAt } from '../floorPattern';
import { scaledFrameSize } from '../spriteSheet';
import { ARENA, DEPTH } from '../theme';

/**
 * Lantai arena dari ubin Tiny Factory. Semua ubin digambar sekali ke satu
 * tekstur kanvas, sehingga arena hanya membayar satu gambar per frame.
 * Tanpa tekstur aset, view ini tidak menggambar apa pun dan latar polos
 * (COLORS.background) tetap terlihat (placeholder, CLAUDE.md aturan 8).
 */
export class FloorView {
  private readonly image: GameObjects.Image | null = null;

  constructor(scene: Scene) {
    if (!scene.textures.exists(TINY_FACTORY.key)) return;

    // null bila tekstur lantai sudah dibuat sebelumnya; cukup dipakai ulang.
    const floor = scene.textures.createCanvas(
      FLOOR_TEXTURE_KEY,
      ARENA.width,
      ARENA.height,
    );
    if (floor !== null) {
      const size = scaledFrameSize(TINY_FACTORY);
      const columns = Math.ceil(ARENA.width / size);
      const rows = Math.ceil(ARENA.height / size);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          floor.drawFrame(
            TINY_FACTORY.key,
            floorFrameAt(col, row),
            col * size,
            row * size,
            false,
          );
        }
      }
      floor.refresh();
    }
    this.image = scene.add
      .image(0, 0, FLOOR_TEXTURE_KEY)
      .setOrigin(0, 0)
      .setDepth(DEPTH.floor);
  }

  destroy(): void {
    this.image?.destroy();
  }
}
