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

/** Latar layar arena; dipasang memenuhi kanvas tanpa nearest-neighbor. */
export const ARENA_BACKGROUND = {
  key: 'bg-arena',
  path: 'world/bg-arena.png',
} as const;

/** Semua spritesheet yang dimuat Preloader. */
export const SHEETS: readonly SheetSpec[] = [TINY_FACTORY];

/** Gambar tunggal yang dibesarkan menjadi satu tekstur (mis. ubin jalan). */
export interface ImageSpec {
  key: string;
  sourceKey: string;
  /** Jalur relatif terhadap public/assets. */
  path: string;
  /** Pembesaran bulat (nearest-neighbor). */
  scale: number;
}

/**
 * Skala ubin jalan. Bila diubah, ROAD di theme.ts (unit, width, corner)
 * dan layout jalan (kelipatan unit) harus disesuaikan.
 */
const ROAD_SCALE = 2;

/** Jalan lurus mendatar 16x32 px; jalan tegak = diputar 90 derajat. */
export const ROAD_STRAIGHT: ImageSpec = {
  key: 'road-straight',
  sourceKey: 'road-straight-src',
  path: 'world/road-straight.png',
  scale: ROAD_SCALE,
};

/** Sudut kanan-atas 48x48 px; tiga sudut lain lewat flip. */
export const ROAD_CURVE: ImageSpec = {
  key: 'road-curve',
  sourceKey: 'road-curve-src',
  path: 'world/road-curve.png',
  scale: ROAD_SCALE,
};

export const IMAGES: readonly ImageSpec[] = [ROAD_STRAIGHT, ROAD_CURVE];

/** Berkas lain yang wajib ada (dicek tes manifest). */
export const EXTRA_FILES: readonly string[] = [
  'world/tiny-factory-license.txt',
  'world/road-straight.png',
  'world/road-curve.png',
  ARENA_BACKGROUND.path,
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
  iconWork: 122,
  iconCompute: 114,
  iconTransfer: 130,
  crate: 73,
} as const;

/** Satu dari tiap sekian ubin lantai memakai variasi berserpihan. */
export const FLOOR_DEBRIS_EVERY = 6;

/**
 * Frame robot menurut urutan thread: biru, merah, hijau, oranye (mesin kecil
 * bermuka layar). Berulang bila robot lebih dari empat (Level 1-3: 8 robot).
 */
export const ROBOT_FRAMES: readonly number[] = [111, 75, 99, 87];

export function robotFrameFor(index: number): number {
  const total = ROBOT_FRAMES.length;
  return ROBOT_FRAMES[((index % total) + total) % total] ?? 0;
}
