import { applyTools, type PlacedTool } from '../../engine/tools';
import type { EngineConfig } from '../../engine/types';
import { buildEngineConfig } from '../../controller/buildEngineConfig';
import { level2_1 } from './level-2-1';
import { level2_2 } from './level-2-2';
import { level2_3 } from './level-2-3';

const COMPONENTS = [level2_1, level2_2, level2_3] as const;
const COMPONENT_CONFIGS = COMPONENTS.map((level) =>
  buildEngineConfig(level, []),
);

function mergeRecords<T>(
  records: readonly (Readonly<Record<string, T>> | undefined)[],
): Record<string, T> {
  const merged: Record<string, T> = {};
  for (const record of records) {
    if (record === undefined) continue;
    for (const [key, value] of Object.entries(record)) merged[key] = value;
  }
  return merged;
}

/**
 * Konfigurasi gabungan tanpa dialog, target, atau tata letak. Konten level
 * (termasuk besar anggaran) ditetapkan kemudian oleh definisi Level 2-4.
 */
export function buildLevel24ScenarioConfig(
  placedTools: readonly PlacedTool[] = [],
  toolBudget?: number,
): EngineConfig {
  const threads = COMPONENT_CONFIGS.flatMap((config) => config.threads);
  const semaphores = mergeRecords(
    COMPONENT_CONFIGS.map((config) => config.semaphores),
  );
  const rwLocks = mergeRecords(
    COMPONENT_CONFIGS.map((config) => config.rwLocks),
  );

  // Enforce tool budget if set
  if (toolBudget !== undefined && placedTools.length > toolBudget) {
    throw new Error(
      `Melebihi anggaran alat: maksimal ${toolBudget}, diajukan ${placedTools.length}`,
    );
  }

  for (const tool of placedTools) {
    if (tool.kind === 'semaphore') semaphores[tool.sem] = tool.value;
    if (tool.kind === 'rwlock' && tool.policy !== undefined) {
      rwLocks[tool.lock] = tool.policy;
    }
  }

  return {
    threads: applyTools(threads, [...placedTools]),
    sharedVars: mergeRecords(
      COMPONENT_CONFIGS.map((config) => config.sharedVars),
    ),
    mutexes: COMPONENT_CONFIGS.flatMap((config) => config.mutexes),
    semaphores,
    conditions: COMPONENT_CONFIGS.flatMap((config) => config.conditions),
    rwLocks,
    boards: COMPONENT_CONFIGS.flatMap((config) => config.boards ?? []),
    buffers: mergeRecords(COMPONENT_CONFIGS.map((config) => config.buffers)),
    starvationTicks: level2_2.starvationTicks,
    recovery: 'manual',
    scheduler: {
      kind: 'random',
      cores: COMPONENT_CONFIGS.reduce(
        (total, config) => total + config.scheduler.cores,
        0,
      ),
    },
    maxTicks: Math.max(...COMPONENT_CONFIGS.map((config) => config.maxTicks)),
  };
}
