import { applyTools, type PlacedTool } from '../engine/tools';
import type { EngineConfig } from '../engine/types';
import type { LevelDefinition } from '../levels/types';

/** Batas pengaman bila level tidak menentukan `maxTicks`. */
export const DEFAULT_MAX_TICKS = 2000;

/**
 * Menerjemahkan LevelDefinition + alat pilihan pemain menjadi EngineConfig.
 * Engine sengaja tidak mengenal LevelDefinition (lihat ARCHITECTURE.md 4.3),
 * jadi penerjemahan ini dilakukan di sini. Fungsi murni: data level tidak diubah.
 */
export function buildEngineConfig(
  level: LevelDefinition,
  placedTools: readonly PlacedTool[],
): EngineConfig {
  const mutexes: string[] = [];
  const semaphores: Record<string, number> = {};
  const conditions: string[] = [];

  for (const resource of level.resources) {
    if (resource.kind === 'mutex') mutexes.push(resource.id);
    else if (resource.kind === 'semaphore')
      semaphores[resource.id] = resource.initialValue;
    else conditions.push(resource.id);
  }

  return {
    threads: applyTools(level.threads, [...placedTools]),
    sharedVars: { ...level.sharedVars },
    mutexes,
    semaphores,
    conditions,
    scheduler: level.scheduler,
    maxTicks: level.maxTicks ?? DEFAULT_MAX_TICKS,
  };
}
