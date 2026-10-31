import type { ModuleCard } from './modeSelect';
import { UI_ASSETS } from './uiAssets';

/**
 * Posisi satu bangunan modul di atas peta, dalam persen terhadap kotak peta
 * (16:9). `left` dan `top` adalah sudut kiri atas gambar bangunan; `width`
 * adalah lebar gambar. Tinggi mengikuti rasio gambar.
 */
export interface MapSpot {
  left: number;
  top: number;
  width: number;
  image: string;
}

/**
 * Data tata letak denah. Bila bangunan meleset dari lahan di peta, ubah
 * angka di sini saja. Modul tanpa entri tidak digambar di peta.
 */
export const MODULE_SPOTS: Readonly<Record<number, MapSpot>> = {
  1: { left: 14, top: 15.5, width: 24, image: UI_ASSETS.buildingModule1 },
  2: { left: 61, top: 16, width: 24, image: UI_ASSETS.buildingModule2 },
};

export function spotFor(moduleId: number): MapSpot | null {
  return MODULE_SPOTS[moduleId] ?? null;
}

/**
 * Modul yang terpilih saat layar dibuka: modul terbuka yang belum tamat,
 * lalu modul terbuka pertama, lalu modul pertama. Null bila tidak ada modul.
 */
export function defaultModuleId(cards: readonly ModuleCard[]): number | null {
  const open = cards.filter((card) => card.unlocked);
  const ongoing = open.find((card) => card.clearedCount < card.totalCount);
  if (ongoing !== undefined) return ongoing.id;
  if (open.length > 0) return open[0].id;
  return cards.length > 0 ? cards[0].id : null;
}
