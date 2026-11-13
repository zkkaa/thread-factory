import type { Snapshot } from '../../engine/types';
import type { LevelDefinition, ResourceDef } from '../types';
import { LEVEL_2_4_CONTENT } from './level-2-4.content';
import { level2_1 } from './level-2-1';
import { level2_2 } from './level-2-2';
import { level2_3 } from './level-2-3';
import {
  LEVEL_2_3_SEAT_SEMAPHORE,
  LEVEL_2_3_THREADS,
} from './level-2-3.scenario';

/**
 * Level 2-4: Lini Produksi Penuh. Menggabungkan tiga komponen (ban, papan,
 * meja teknisi) dari level 2-1, 2-2, dan 2-3. Data diambil dari level
 * komponen agar tetap sama dengan `level-2-4.scenario.ts`.
 */
const COMPONENTS: readonly LevelDefinition[] = [level2_1, level2_2, level2_3];

/** Penanda pengisi: level ini dinilai dari invariant, bukan variabel bersama. */
const MARKER = 'selesai';

/** Anggaran alat (koin). Harus sama dengan teks di level-2-4.content.ts. */
export const LEVEL_2_4_TOOL_BUDGET = 4;

function mergeResources(): ResourceDef[] {
  const byId = new Map<string, ResourceDef>();
  for (const level of COMPONENTS) {
    for (const resource of level.resources) {
      if (!byId.has(resource.id)) byId.set(resource.id, resource);
    }
  }
  return [...byId.values()];
}

function mergeSharedVars(): Record<string, number> {
  const merged: Record<string, number> = { [MARKER]: 0 };
  for (const level of COMPONENTS) Object.assign(merged, level.sharedVars);
  return merged;
}

function mergeBuffers(): NonNullable<LevelDefinition['buffers']> {
  const merged: NonNullable<LevelDefinition['buffers']> = {};
  for (const level of COMPONENTS) Object.assign(merged, level.buffers);
  return merged;
}

/**
 * Lulus hanya bila ketiga komponen lulus pada invariant-nya sendiri.
 * Pesan yang dikembalikan adalah pesan komponen pertama yang gagal.
 */
function invariant(snap: Snapshot): { ok: boolean; message: string } {
  for (const level of COMPONENTS) {
    const verdict = level.goal.invariant(snap);
    if (!verdict.ok) {
      return { ok: false, message: `Level ${level.id}: ${verdict.message}` };
    }
  }
  return {
    ok: true,
    message: 'Ban, papan, dan meja teknisi semuanya aman dan tuntas.',
  };
}

export const level2_4: LevelDefinition = {
  id: '2-4',
  module: 2,
  title: 'Lini Produksi Penuh',
  ...LEVEL_2_4_CONTENT,
  layoutId: '2-4',
  resultMode: 'verdict',
  threads: COMPONENTS.flatMap((level) =>
    level.threads.map((thread) => ({
      ...thread,
      program: thread.program.map((instruction) => ({ ...instruction })),
    })),
  ),
  sharedVars: mergeSharedVars(),
  resources: mergeResources(),
  buffers: mergeBuffers(),
  availableTools: [...new Set(COMPONENTS.flatMap((l) => l.availableTools))],
  toolBudget: LEVEL_2_4_TOOL_BUDGET,
  semaphoreScope: {
    sem: LEVEL_2_3_SEAT_SEMAPHORE,
    threadIds: LEVEL_2_3_THREADS.map((thread) => thread.id),
  },
  scheduler: {
    kind: 'random',
    cores: COMPONENTS.reduce((sum, l) => sum + l.scheduler.cores, 0),
  },
  // Tanpa alat, komponen meja teknisi pasti deadlock, jadi seed apa pun
  // gagal pada tutorial. Seed 1 mengikuti level 2-2 dan 2-3.
  tutorialSeed: 1,
  maxTicks: Math.max(...COMPONENTS.map((l) => l.maxTicks ?? 0)),
  starvationTicks: level2_2.starvationTicks,
  recovery: 'manual',
  goal: {
    target: { variable: MARKER, value: 0 },
    invariant,
    // Diukur pada seed tutorial 1 (13 Nov 2026), kombinasi lengkap:
    // fair kursi 3 = tick 84, tunggu 282 (3 bintang); fair/writer kursi 4 =
    // tick 90/94, tunggu 328/327 (2 bintang). Ukur ulang bila level berubah.
    stars: { fast: 100, lowWait: 300 },
  },
};
