import { applyToolsDetailed, type PlacedTool } from '../engine/tools';
import type { LevelDefinition } from '../levels/types';

/** Program efektif tiap robot (sudah berisi LOCK/UNLOCK) beserta peta asal instruksinya. */
export function effectivePrograms(
  level: LevelDefinition,
  tools: readonly PlacedTool[],
) {
  return applyToolsDetailed(level.threads, [...tools]);
}
