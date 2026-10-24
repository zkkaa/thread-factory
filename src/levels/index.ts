import { level1_1 } from './module1/level-1-1';
import type { LevelDefinition } from './types';

export * from './types';
export { level1_1 } from './module1/level-1-1';

/** Daftar seluruh level yang tersedia dalam game. */
export const ALL_LEVELS: LevelDefinition[] = [level1_1];

/** Cari level berdasarkan id (mis. '1-1'). */
export function findLevelById(id: string): LevelDefinition | undefined {
  return ALL_LEVELS.find((lvl) => lvl.id === id);
}
