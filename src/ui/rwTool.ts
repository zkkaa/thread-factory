import type { RwPolicy } from '../engine/primitives/rwlock';
import type { PlacedTool, ToolSpan } from '../engine/tools';
import type { LevelDefinition } from '../levels/types';

export const RW_POLICIES: readonly RwPolicy[] = ['reader', 'writer', 'fair'];

export const RW_POLICY_LABEL: Record<RwPolicy, string> = {
  reader: 'Utamakan Pembaca',
  writer: 'Utamakan Penulis',
  fair: 'Adil (FIFO)',
};

export interface RwSetup {
  lockId: string;
  defaultPolicy: RwPolicy;
  readers: ToolSpan[];
  writers: ToolSpan[];
}

export function rwToolId(lockId: string): string {
  return `rwlock:${lockId}`;
}

/**
 * Menurunkan rentang pengaman dari program level: pembaca membungkus BOARD_READ,
 * penulis membungkus BOARD_WRITE_START sampai BOARD_WRITE_END. Null bila level
 * tanpa rwlock atau tidak menyediakan alat itu.
 */
export function findRwSetup(level: LevelDefinition): RwSetup | null {
  const lock = level.resources.find((r) => r.kind === 'rwlock');
  if (lock === undefined || lock.kind !== 'rwlock') return null;
  if (!level.availableTools.includes('rwlock')) return null;

  const readers: ToolSpan[] = [];
  const writers: ToolSpan[] = [];
  for (const thread of level.threads) {
    const read = thread.program.findIndex((i) => i.op === 'BOARD_READ');
    const start = thread.program.findIndex((i) => i.op === 'BOARD_WRITE_START');
    const end = thread.program.findIndex((i) => i.op === 'BOARD_WRITE_END');
    if (read >= 0) readers.push({ thread: thread.id, start: read, end: read });
    else if (start >= 0 && end >= start) {
      writers.push({ thread: thread.id, start, end });
    }
  }
  if (readers.length === 0 && writers.length === 0) return null;
  return { lockId: lock.id, defaultPolicy: lock.policy, readers, writers };
}

/** Alat pengaman papan dengan kebijakan pilihan pemain. */
export function buildRwTool(setup: RwSetup, policy: RwPolicy): PlacedTool {
  return {
    id: rwToolId(setup.lockId),
    kind: 'rwlock',
    lock: setup.lockId,
    readers: setup.readers.map((s) => ({ ...s })),
    writers: setup.writers.map((s) => ({ ...s })),
    policy,
    spans: [],
  };
}