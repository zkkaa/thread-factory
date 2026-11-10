import type { ThreadId, ThreadState } from './types';

/**
 * Cuplikan yang dibutuhkan deteksi siklus. Engine yang mengisinya dari
 * keadaan saat ini; fungsi di berkas ini tidak mengubah simulasi.
 */
export interface DeadlockThread {
  id: ThreadId;
  state: ThreadState;
  /** Resource yang ditunggu, mis. `mutex:m1` atau `rw:papan`. */
  waitingOn: string | null;
}

export interface DeadlockMutex {
  id: string;
  owner: ThreadId | null;
}

export interface DeadlockRwLock {
  id: string;
  readers: readonly ThreadId[];
  writer: ThreadId | null;
}

export interface DeadlockView {
  threads: readonly DeadlockThread[];
  mutexes: readonly DeadlockMutex[];
  rwLocks?: readonly DeadlockRwLock[];
}

/**
 * Thread dalam satu siklus tunggu, mengikuti arah "siapa menunggu siapa".
 * Urutan diputar supaya id terkecil di depan, agar seed dan urutan definisi
 * yang sama selalu menghasilkan daftar yang sama.
 * `null` bila tidak ada siklus.
 *
 * Graf hanya menghubungkan thread yang menunggu resource berpemilik jelas:
 * mutex (satu pemilik) dan rwlock (penulis, atau para pembaca). Semaphore dan
 * condition tidak punya pemilik tunggal, jadi tidak membentuk sisi graf.
 * Bila ada lebih dari satu siklus, yang dikembalikan adalah siklus pertama
 * yang ditemukan DFS (thread sesuai urutan masukan, tetangga diurutkan id).
 */
export function findDeadlockCycle(view: DeadlockView): ThreadId[] | null {
  const known = new Set(view.threads.map((thread) => thread.id));
  const adj = new Map<ThreadId, ThreadId[]>();

  for (const thread of view.threads) {
    adj.set(thread.id, []);
  }

  for (const thread of view.threads) {
    if (thread.state !== 'WAITING' || thread.waitingOn === null) continue;

    const holders = holdersOf(thread.waitingOn, view).filter(
      (holder) => holder !== thread.id && known.has(holder),
    );
    holders.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    adj.set(thread.id, holders);
  }

  return firstCycle(
    view.threads.map((thread) => thread.id),
    adj,
  );
}

function holdersOf(waitingOn: string, view: DeadlockView): ThreadId[] {
  const split = waitingOn.indexOf(':');
  if (split <= 0) return [];

  const kind = waitingOn.slice(0, split);
  const name = waitingOn.slice(split + 1);

  if (kind === 'mutex') {
    const mutex = view.mutexes.find((item) => item.id === name);
    return mutex?.owner != null ? [mutex.owner] : [];
  }

  if (kind === 'rw') {
    const lock = view.rwLocks?.find((item) => item.id === name);
    if (lock === undefined) return [];
    if (lock.writer !== null) return [lock.writer];
    return [...lock.readers];
  }

  return [];
}

const UNSEEN = 0;
const ON_PATH = 1;
const DONE = 2;

function firstCycle(
  order: readonly ThreadId[],
  adj: ReadonlyMap<ThreadId, readonly ThreadId[]>,
): ThreadId[] | null {
  const color = new Map<ThreadId, number>();
  for (const id of order) color.set(id, UNSEEN);

  const stack: ThreadId[] = [];

  const visit = (id: ThreadId): ThreadId[] | null => {
    color.set(id, ON_PATH);
    stack.push(id);

    for (const next of adj.get(id) ?? []) {
      const state = color.get(next) ?? UNSEEN;
      if (state === ON_PATH) {
        const start = stack.indexOf(next);
        return rotateToSmallest(stack.slice(start));
      }
      if (state === UNSEEN) {
        const found = visit(next);
        if (found !== null) return found;
      }
    }

    stack.pop();
    color.set(id, DONE);
    return null;
  };

  for (const id of order) {
    if (color.get(id) !== UNSEEN) continue;
    const found = visit(id);
    if (found !== null) return found;
  }

  return null;
}

/** Memutar siklus supaya id terkecil menjadi elemen pertama. */
function rotateToSmallest(cycle: ThreadId[]): ThreadId[] {
  if (cycle.length < 2) return cycle;

  let minIndex = 0;
  for (let i = 1; i < cycle.length; i++) {
    const id = cycle[i] as ThreadId;
    const min = cycle[minIndex] as ThreadId;
    if (id < min) minIndex = i;
  }

  return [...cycle.slice(minIndex), ...cycle.slice(0, minIndex)];
}
