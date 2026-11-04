import type { LevelDefinition } from '../levels/types';

export interface AreaInfo {
  name: string;
  capacity: number;
}

/**
 * Area berkapasitas pertama di level (mis. aula Level 1-3), atau null bila
 * level tidak punya area. Dipakai tampilan (Misi, Metrik, Hasil) untuk memilih
 * teks yang relevan; tidak ada aturan permainan di sini.
 */
export function areaOf(level: LevelDefinition): AreaInfo | null {
  const first = Object.entries(level.areas ?? {})[0];
  if (first === undefined) return null;
  return { name: first[0], capacity: first[1] };
}