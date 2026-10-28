import type { SheetSpec } from './spriteSheet';

/**
 * Folder aset relatif terhadap halaman. Vite menyajikan public/ di akar situs,
 * dan jalur relatif tetap benar bila situs dipasang di sub-folder.
 */
export const ASSET_BASE_PATH = 'assets';

/** Spritesheet Kenney Tiny Factory (192x176, 12x11 ubin 16x16, tanpa jarak). */
export const TINY_FACTORY: SheetSpec = {
  key: 'tiny-factory',
  sourceKey: 'tiny-factory-src',
  path: 'world/tiny-factory.png',
  frameSize: 16,
  columns: 12,
  rows: 11,
  scale: 4,
};

/** Semua spritesheet yang dimuat Preloader. */
export const SHEETS: readonly SheetSpec[] = [TINY_FACTORY];

/** Berkas lain yang wajib ada (dicek tes manifest). */
export const EXTRA_FILES: readonly string[] = [
  'world/tiny-factory-license.txt',
];

/** Kunci tekstur lantai arena yang dibakar sekali oleh FloorView. */
export const FLOOR_TEXTURE_KEY = 'arena-floor';

/**
 * Nomor frame TINY_FACTORY yang sudah dipakai (peta: docs/tiny-factory-frames.png).
 * Tambahkan di sini saat tugas aset berikutnya memakai frame baru.
 */
export const TINY_FRAMES = {
  floorBase: 3,
  floorDebris: 32,
} as const;

/** Satu dari tiap sekian ubin lantai memakai variasi berserpihan. */
export const FLOOR_DEBRIS_EVERY = 6;
