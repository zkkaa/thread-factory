import { level1_1 } from './module1/level-1-1';
import { level1_2 } from './module1/level-1-2';
import { level1_3 } from './module1/level-1-3';
import type { LevelDefinition } from './types';

export * from './types';
export * from './modules';
export { level1_1 } from './module1/level-1-1';
export { level1_2 } from './module1/level-1-2';
export { level1_3 } from './module1/level-1-3';

/** Daftar seluruh level yang tersedia dalam game. */
export const ALL_LEVELS: LevelDefinition[] = [level1_1, level1_2, level1_3];

/** Cari level berdasarkan id (mis. '1-1'). */
export function findLevelById(id: string): LevelDefinition | undefined {
  return ALL_LEVELS.find((lvl) => lvl.id === id);
}
