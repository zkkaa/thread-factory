import type { PlacedTool } from '../engine/tools';
import type { LevelDefinition, ResourceDef } from '../levels/types';

/** Hasil membaca data level: siapa penunggu, siapa pemberi sinyal. */
export interface ConditionSetup {
  condId: string;
  mutexId: string;
  /** Instruksi SPIN_UNTIL (indeks asli) yang akan diganti menjadi tidur. */
  waiter: { thread: string; index: number };
  signalerId: string;
  /** Nama operasi program asli pemberi sinyal, untuk menggambar slot. */
  signalerOps: string[];
}

type ConditionResource = Extract<ResourceDef, { kind: 'condition' }>;

export function conditionToolId(condId: string): string {
  return `condition:${condId}`;
}

/**
 * Mencari pasangan penunggu dan pemberi sinyal dari data level (bukan dari id
 * level): penunggu = thread pertama yang berprogram SPIN_UNTIL, pemberi sinyal
 * = thread lain. Mengembalikan null bila level tidak cocok untuk alat ini.
 */
export function findConditionSetup(
  level: LevelDefinition,
): ConditionSetup | null {
  const resource = level.resources.find(
    (r): r is ConditionResource => r.kind === 'condition',
  );
  if (resource === undefined) return null;

  const waiter = level.threads.find((thread) =>
    thread.program.some((instruction) => instruction.op === 'SPIN_UNTIL'),
  );
  if (waiter === undefined) return null;
  const index = waiter.program.findIndex(
    (instruction) => instruction.op === 'SPIN_UNTIL',
  );
  const signaler = level.threads.find((thread) => thread.id !== waiter.id);
  if (signaler === undefined) return null;

  return {
    condId: resource.id,
    mutexId: resource.mutex,
    waiter: { thread: waiter.id, index },
    signalerId: signaler.id,
    signalerOps: signaler.program.map((instruction) => instruction.op),
  };
}

/** Membangun alat Lampu Sinyal; slot null berarti tidak ada alat (dilepas). */
export function buildConditionTool(
  setup: ConditionSetup,
  slot: number | null,
): PlacedTool | null {
  if (slot === null) return null;
  return {
    id: conditionToolId(setup.condId),
    kind: 'condition',
    cond: setup.condId,
    mutex: setup.mutexId,
    waiter: { ...setup.waiter },
    signaler: { thread: setup.signalerId, slot },
    spans: [],
  };
}

/** Slot pemberi sinyal pada alat terpasang, atau null. */
export function readConditionSlot(
  tool: PlacedTool | null | undefined,
): number | null {
  return tool?.kind === 'condition' ? tool.signaler.slot : null;
}
