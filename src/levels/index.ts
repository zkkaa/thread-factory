import { level1_1 } from './module1/level-1-1';
import { level1_2 } from './module1/level-1-2';
import { level1_3 } from './module1/level-1-3';
import { level1_4 } from './module1/level-1-4';
import { level1_5 } from './module1/level-1-5';
import type { LevelDefinition } from './types';

export * from './types';
export * from './modules';
export { level1_1 } from './module1/level-1-1';
export { level1_2 } from './module1/level-1-2';
export { level1_3 } from './module1/level-1-3';
export { level1_4 } from './module1/level-1-4';
export { level1_5 } from './module1/level-1-5';

/** Daftar seluruh level yang tersedia dalam game. */
export const ALL_LEVELS: LevelDefinition[] = [
  level1_1,
  level1_2,
  level1_3,
  level1_4,
  level1_5,
];

/** Cari level berdasarkan id (mis. '1-1'). */
export function findLevelById(id: string): LevelDefinition | undefined {
  return ALL_LEVELS.find((lvl) => lvl.id === id);
}
