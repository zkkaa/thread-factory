import { Scene } from 'phaser';
import type { SimulationController } from '../../controller/SimulationController';
import { ASSET_BASE_PATH, SHEETS } from '../assetManifest';
import {
  frameCount,
  frameRect,
  scaledFrameSize,
  type SheetSpec,
} from '../spriteSheet';

/** Data dari Boot: controller diteruskan ke LevelScene. */
export interface PreloaderData {
  controller: SimulationController;
}

/**
 * Memuat aset, lalu membesarkan tiap spritesheet dengan nearest-neighbor ke
 * tekstur kanvas (tanpa pixelArt global: lihat ARCHITECTURE bagian 15). Bila
 * berkas gagal dimuat, game tetap jalan; tiap view menggambar placeholder.
 */
export class Preloader extends Scene {
  private controller: SimulationController | null = null;

  constructor() {
    super('Preloader');
  }

  init(data: PreloaderData): void {
    this.controller = data.controller;
  }

  preload(): void {
    this.load.setPath(ASSET_BASE_PATH);
    for (const sheet of SHEETS) this.load.image(sheet.sourceKey, sheet.path);
  }

  create(): void {
    for (const sheet of SHEETS) this.buildScaledSheet(sheet);
    this.scene.start('LevelScene', { controller: this.controller });
  }

  private buildScaledSheet(sheet: SheetSpec): void {
    if (!this.textures.exists(sheet.sourceKey)) {
      console.warn(`Aset "${sheet.path}" gagal dimuat; memakai placeholder.`);
      return;
    }
    const source = this.textures.get(sheet.sourceKey).getSourceImage();
    if (!(source instanceof HTMLImageElement)) return;

    const size = scaledFrameSize(sheet);
    const texture = this.textures.createCanvas(
      sheet.key,
      sheet.columns * size,
      sheet.rows * size,
    );
    // null bila kunci sudah dipakai; teksturnya sudah ada, tidak perlu dibuat lagi.
    if (texture === null) return;

    const context = texture.getContext();
    context.imageSmoothingEnabled = false;
    context.drawImage(
      source,
      0,
      0,
      source.width,
      source.height,
      0,
      0,
      texture.width,
      texture.height,
    );
    for (let index = 0; index < frameCount(sheet); index++) {
      const rect = frameRect(sheet, index);
      texture.add(index, 0, rect.x, rect.y, rect.width, rect.height);
    }
    texture.refresh();
  }
}
