import type { RwPolicy } from '../engine/primitives/rwlock';
import { applyTools, type PlacedTool } from '../engine/tools';
import type { EngineConfig } from '../engine/types';
import type { LevelDefinition } from '../levels/types';

/** Batas pengaman bila level tidak menentukan `maxTicks`. */
export const DEFAULT_MAX_TICKS = 2000;

/** Opsi tambahan (mis. dari Sandbox). */
export interface BuildOptions {
  /** Mengganti kebijakan semua rwlock di level (Level 2-2). */
  rwPolicy?: RwPolicy;
}

/**
 * Menerjemahkan LevelDefinition + alat pilihan pemain menjadi EngineConfig.
 * Engine sengaja tidak mengenal LevelDefinition (lihat ARCHITECTURE.md 4.3),
 * jadi penerjemahan ini dilakukan di sini. Fungsi murni: data level tidak diubah.
 */
export function buildEngineConfig(
  level: LevelDefinition,
  placedTools: readonly PlacedTool[],
  options: BuildOptions = {},
): EngineConfig {
  const mutexes: string[] = [];
  const semaphores: Record<string, number> = {};
  const conditions: string[] = [];
  const rwLocks: Record<string, RwPolicy> = {};
  const boards: string[] = [];

  for (const resource of level.resources) {
    switch (resource.kind) {
      case 'mutex':
        mutexes.push(resource.id);
        break;
      case 'semaphore':
        semaphores[resource.id] = resource.initialValue;
        break;
      case 'condition':
        conditions.push(resource.id);
        break;
      case 'rwlock':
        rwLocks[resource.id] = options.rwPolicy ?? resource.policy;
        break;
      case 'board':
        boards.push(resource.id);
        break;
    }
  }

  // Alat semaphore membawa nilai awal pilihan pemain (1 sampai 8).
    for (const tool of placedTools) {
    if (tool.kind === 'semaphore') semaphores[tool.sem] = tool.value;
    // Kebijakan pilihan pemain; opsi Sandbox (rwPolicy) tetap yang menang.
    if (tool.kind === 'rwlock' && tool.policy !== undefined) {
      rwLocks[tool.lock] = options.rwPolicy ?? tool.policy;
    }
  }

   return {
    threads: applyTools(level.threads, [...placedTools]),
    sharedVars: { ...level.sharedVars },
    mutexes,
    semaphores,
    conditions,
    rwLocks,
    boards,
    scheduler: level.scheduler,
    maxTicks: level.maxTicks ?? DEFAULT_MAX_TICKS,
    ...(level.areas !== undefined ? { areas: { ...level.areas } } : {}),
    ...(level.buffers !== undefined ? { buffers: { ...level.buffers } } : {}),
    ...(level.starvationTicks !== undefined
      ? { starvationTicks: level.starvationTicks }
      : {}),
    ...(level.recovery !== undefined ? { recovery: level.recovery } : {}),
  };
}