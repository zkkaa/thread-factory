import { UI_ASSETS } from './uiAssets';

/** Titik di atas peta, dalam persen terhadap kotak peta 16:9. */
export interface MapPoint {
  x: number;
  y: number;
}

/**
 * Tata letak Peta Level (S3b) satu modul. Semua koordinat adalah data
 * (CLAUDE.md aturan 9): bila titik meleset dari lahan di gambar, ubah angka
 * di sini saja.
 */
export interface LevelMapLayout {
  /** Gambar peta modul ini. */
  mapImage: string;
  /** Lebar pedestal, persen lebar kotak peta. */
  padWidth: number;
  /** Pusat pedestal tiap level, kunci = id level. */
  pads: Readonly<Record<string, MapPoint>>;
  /**
   * Titik antara untuk membengkokkan jalur. `via[i]` berada di antara level
   * ke-i dan ke-(i+1) menurut urutan `levelIds` modul; boleh kosong.
   */
  via: readonly (readonly MapPoint[])[];
  /** Robot pemandu: posisi tetap (pusat gambar) dan lebarnya, persen kotak peta. */
  robot: MapPoint & { width: number };
}

/** Koordinat awal diukur dari gambar peta; setel ulang setelah melihat hasilnya. */
export const LEVEL_MAP_LAYOUTS: Readonly<Record<number, LevelMapLayout>> = {
  1: {
    mapImage: UI_ASSETS.mapLevelsModule1,
    padWidth: 8,
    pads: {
      '1-1': { x: 9.0, y: 38.3 },
      '1-2': { x: 43, y: 24 },
      '1-3': { x: 61.2, y: 47.3 },
      '1-4': { x: 37.7, y: 64 },
      '1-5': { x: 90.5, y: 69.4 },
    },
    via: [
      [
        { x: 25, y: 27},
        { x: 37, y: 22.5},
        { x: 45, y: 24},
      ],
      [
        { x: 46, y: 23 },
        { x: 54, y: 26 },
        { x: 58, y: 33 },
        { x: 59, y: 38 },
      ],
      [
        { x: 54.5, y: 50 },
        { x: 40, y: 61 },
      ],
      [
        { x: 48, y: 80 },
        { x: 60, y: 74.5 },
        { x: 78, y: 74.5 },
      ],
    ],
    // Di depan pintu rumah di pulau tengah.
    robot: { x: 31, y: 50, width: 6.5 },
  },
  2: {
    mapImage: UI_ASSETS.mapLevelsModule2,
    padWidth: 8,
    pads: {
      '2-1': { x: 12.5, y: 39.5 },
      '2-2': { x: 44.2, y: 25.4 },
      '2-3': { x: 66.4, y: 46 },
      '2-4': { x: 88, y: 73 },
    },
    via: [
      [
        { x: 22.5, y: 34.2 },
        { x: 24.5, y: 32.5 },
        { x: 33, y: 27 },
        { x: 38, y: 25 },
      ],
      [
        { x: 50, y: 24 },
        { x: 57, y: 28 },
        { x: 61, y: 33.8},
      ],
      [
        { x: 75, y: 48 },
        { x: 80, y: 52 },
        { x: 83, y: 58 },
        { x: 88, y: 73 },
      ],
    ],
    robot: { x: 33, y: 51, width: 6.5 },
  },
};

export function layoutFor(moduleId: number): LevelMapLayout | null {
  return LEVEL_MAP_LAYOUTS[moduleId] ?? null;
}

function inRange(point: MapPoint): boolean {
  return point.x >= 0 && point.x <= 100 && point.y >= 0 && point.y <= 100;
}

/**
 * Memeriksa tata letak terhadap daftar level modulnya. Mengembalikan daftar
 * masalah (kosong bila sah); dipakai tes.
 */
export function validateLevelMapLayout(
  layout: LevelMapLayout,
  levelIds: readonly string[],
): string[] {
  const problems: string[] = [];
  if (layout.padWidth <= 0) problems.push('padWidth harus positif');
  if (layout.robot.width <= 0) problems.push('lebar robot harus positif');
  if (!inRange(layout.robot)) problems.push('robot di luar 0..100');
  for (const levelId of levelIds) {
    const pad = layout.pads[levelId];
    if (pad === undefined) problems.push(`level ${levelId} belum punya titik`);
    else if (!inRange(pad)) problems.push(`titik ${levelId} di luar 0..100`);
  }
  for (const key of Object.keys(layout.pads)) {
    if (!levelIds.includes(key))
      problems.push(`titik ${key} bukan level modul`);
  }
  const expectedVia = Math.max(0, levelIds.length - 1);
  if (layout.via.length !== expectedVia) {
    problems.push(`via harus ${expectedVia} ruas, ada ${layout.via.length}`);
  }
  layout.via.forEach((segment, index) => {
    if (!segment.every(inRange)) {
      problems.push(`via ruas ${index} di luar 0..100`);
    }
  });
  return problems;
}
