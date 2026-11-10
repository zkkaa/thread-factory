import type { RwPolicy } from '../engine/primitives/rwlock';
import { applyTools, type PlacedTool } from '../engine/tools';
import type { EngineConfig } from '../engine/types';
import type { LevelDefinition } from '../levels/types';

/** Batas pengaman bila level tidak menentukan `maxTicks`. */
export const DEFAULT_MAX_TICKS = 2000;

/** Pengaturan tambahan di luar data level (mis. dari sakelar kebijakan atau Sandbox). */
export interface BuildOptions {
  /** Mengganti kebijakan SEMUA kunci baca-tulis di level (reader, writer, fair). */
  rwPolicy?: RwPolicy;
}

function assertNever(value: never): never {
  throw new Error(`Jenis resource tidak dikenal: ${JSON.stringify(value)}`);
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

  // Tiap jenis ditangani eksplisit; jenis baru tanpa penanganan gagal di typecheck
  // (dulu "selain mutex dan semaphore" otomatis dianggap condition).
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
      default:
        assertNever(resource);
    }
  }

  for (const tool of placedTools) {
    if (tool.kind === 'semaphore') {
      semaphores[tool.sem] = tool.value;
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
    areas: level.areas,
    buffers: level.buffers,
    maxTicks: level.maxTicks ?? DEFAULT_MAX_TICKS,
  };
}