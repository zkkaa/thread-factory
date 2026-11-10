import type { PlacedTool } from '../engine/tools';
import type { LevelDefinition } from '../levels/types';

/**
 * Logika murni toolbox ban berjalan (Level 2-1), dipisah dari React agar
 * bisa dites di Vitest. Ada dua penjaga:
 * - 'slot'  : perakit menunggu slot kosong (empty) sebelum PUT_ITEM, lalu
 *             memberi tanda barang tersedia (full);
 * - 'item'  : pengepak menunggu barang tersedia (full) sebelum TAKE_ITEM,
 *             lalu memberi tanda slot kosong (empty).
 * Nilai awal empty dan full diambil dari resources level, bukan dari alat.
 */
export type BeltGuard = 'slot' | 'item';

const EMPTY_ID = 'empty';
const FULL_ID = 'full';

/** Thread dan indeks instruksi asli yang dibungkus penjaga. */
export interface BeltTarget {
  thread: string;
  index: number;
}

export interface BeltSetup {
  producers: BeltTarget[];
  consumers: BeltTarget[];
}

export function beltToolId(guard: BeltGuard): string {
  return `belt:${guard}`;
}

function findTargets(
  level: LevelDefinition,
  op: 'PUT_ITEM' | 'TAKE_ITEM',
): BeltTarget[] {
  return level.threads.flatMap((thread) => {
    const index = thread.program.findIndex(
      (instruction) => instruction.op === op,
    );
    return index === -1 ? [] : [{ thread: thread.id, index }];
  });
}

/**
 * Membaca data level: perakit = thread berprogram PUT_ITEM, pengepak =
 * thread berprogram TAKE_ITEM. Null bila level tidak cocok untuk alat ini.
 */
export function findBeltSetup(level: LevelDefinition): BeltSetup | null {
  if (!level.availableTools.includes('semaphorePair')) return null;
  const hasSemaphore = (id: string): boolean =>
    level.resources.some(
      (resource) => resource.kind === 'semaphore' && resource.id === id,
    );
  if (!hasSemaphore(EMPTY_ID) || !hasSemaphore(FULL_ID)) return null;

  const producers = findTargets(level, 'PUT_ITEM');
  const consumers = findTargets(level, 'TAKE_ITEM');
  if (producers.length === 0 || consumers.length === 0) return null;
  return { producers, consumers };
}

/** Membangun alat satu penjaga untuk semua robot yang sesuai. */
export function buildBeltTool(setup: BeltSetup, guard: BeltGuard): PlacedTool {
  const isSlot = guard === 'slot';
  const targets = isSlot ? setup.producers : setup.consumers;
  return {
    id: beltToolId(guard),
    kind: 'semaphorePair',
    waitSem: isSlot ? EMPTY_ID : FULL_ID,
    signalSem: isSlot ? FULL_ID : EMPTY_ID,
    spans: targets.map((target) => ({
      thread: target.thread,
      start: target.index,
      end: target.index,
    })),
  };
}

export function isBeltGuardPlaced(
  tools: readonly PlacedTool[],
  guard: BeltGuard,
): boolean {
  const id = beltToolId(guard);
  return tools.some((tool) => tool.id === id);
}
