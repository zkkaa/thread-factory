import { spotFor } from './moduleMap';
import { UI_ASSETS } from './uiAssets';

/** Latar Pembuka Modul (S3a): peta Peta Level modul itu, supaya peralihan mulus. */
const MAP_BACKGROUNDS: Readonly<Record<number, string>> = {
  1: UI_ASSETS.mapLevelsModule1,
  2: UI_ASSETS.mapLevelsModule2,
};

/** Jalur peta latar untuk modul, atau null bila tidak ada. */
export function moduleMapBackground(moduleId: number): string | null {
  return MAP_BACKGROUNDS[moduleId] ?? null;
}

/** Gambar bangunan modul (sama dengan yang dipilih di denah S2), atau null. */
export function moduleBuildingImage(moduleId: number): string | null {
  return spotFor(moduleId)?.image ?? null;
}
