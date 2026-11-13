import type { Snapshot } from './types';

export type CoffmanKey =
  'mutualExclusion' | 'holdAndWait' | 'noPreemption' | 'circularWait';

export type CoffmanState = Record<CoffmanKey, boolean>;

/**
 * Menyatakan empat kondisi Coffman dari snapshot saat ini (fungsi murni).
 * - mutualExclusion: ada kunci yang sedang dipegang;
 * - holdAndWait: ada thread yang memegang satu kunci sambil mengantre di kunci lain;
 * - noPreemption: ada kunci dipegang dan belum ada perampasan (preempt) sejak tick 0;
 * - circularWait: engine mendeteksi siklus tunggu (Snapshot.deadlock terisi).
 */
export function computeCoffman(snapshot: Readonly<Snapshot>): CoffmanState {
  const owners = new Set<string>();
  for (const mutex of snapshot.mutexes) {
    if (mutex.owner !== null) owners.add(mutex.owner);
  }
  const anyHeld = owners.size > 0;
  const holdAndWait = snapshot.mutexes.some((mutex) =>
    mutex.queue.some((waiter) => owners.has(waiter)),
  );
  return {
    mutualExclusion: anyHeld,
    holdAndWait,
    noPreemption: anyHeld && (snapshot.preemptions ?? 0) === 0,
    circularWait: (snapshot.deadlock?.length ?? 0) > 0,
  };
}
