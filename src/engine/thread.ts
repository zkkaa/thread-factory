import type { Condition, ConditionWaiter } from './primitives/condition';
import type { Mutex } from './primitives/mutex';
import type { Semaphore } from './primitives/semaphore';
import type { BoundedBuffer } from './primitives/buffer';
import type {
  SimEvent,
  ThreadDef,
  ThreadId,
  ThreadSnapshot,
  ThreadState,
} from './types';
import type { Board } from './primitives/board';
import type { RwLock } from './primitives/rwlock';

/**
 * Keadaan sebuah thread selama simulasi berjalan.
 * Objek ini dimiliki dan diubah HANYA oleh Engine; pihak luar hanya melihat
 * salinannya lewat snapshotThread().
 */
export interface ThreadRuntime {
  readonly def: ThreadDef;
  state: ThreadState;
  /** Indeks instruksi berikutnya. Saat WAITING, menunjuk instruksi yang memblokir. */
  pc: number;
  /** Pengulangan program ke berapa (mulai 0). */
  iteration: number;
  registers: Record<string, number>;
  waitingOn: string | null;
  /** Sisa tick untuk instruksi WORK yang sedang berjalan (0 = tidak sedang WORK). */
  workRemaining: number;
  waitTicks: number;
  busyWaitTicks: number;
}

/**
 * Akses ke resource sinkronisasi dan thread lain, dibutuhkan instruksi yang
 * bisa memblokir atau membangunkan thread (LOCK, UNLOCK, dst.).
 */
export interface SyncContext {
  mutexes: ReadonlyMap<string, Mutex>;
  semaphores?: ReadonlyMap<string, Semaphore>;
  conditions?: ReadonlyMap<string, Condition>;
  buffers?: ReadonlyMap<string, BoundedBuffer>;
  rwLocks?: ReadonlyMap<string, RwLock>;
  boards?: ReadonlyMap<string, Board>;
  enterArea?: (threadId: ThreadId, area: string) => void;
  leaveArea?: (threadId: ThreadId, area: string) => void;
  /** Mengambil thread lain (untuk dibangunkan). Melempar error bila tidak ada. */
  getThread(id: ThreadId): ThreadRuntime;
}

const EMPTY_SYNC: SyncContext = {
  mutexes: new Map(),
  getThread(id) {
    throw new Error(
      `Thread "${id}" tidak tersedia (tanpa konteks sinkronisasi)`,
    );
  },
};

/**
 * Transisi state yang sah. Selain tabel ini, engine melempar error supaya bug
 * (mis. membangunkan thread yang tidak sedang WAITING) langsung ketahuan.
 */
const ALLOWED_TRANSITIONS: Record<ThreadState, readonly ThreadState[]> = {
  NEW: ['READY'],
  READY: ['RUNNING'],
  RUNNING: ['READY', 'WAITING', 'TERMINATED'],
  WAITING: ['READY'],
  TERMINATED: [],
};

export function createThread(def: ThreadDef): ThreadRuntime {
  return {
    def,
    state: 'NEW',
    pc: 0,
    iteration: 0,
    registers: {},
    waitingOn: null,
    workRemaining: 0,
    waitTicks: 0,
    busyWaitTicks: 0,
  };
}

/** Salinan keadaan thread untuk Snapshot (aman dari modifikasi pihak luar). */
export function snapshotThread(thread: ThreadRuntime): ThreadSnapshot {
  return {
    id: thread.def.id,
    label: thread.def.label,
    state: thread.state,
    pc: thread.pc,
    iteration: thread.iteration,
    registers: { ...thread.registers },
    waitingOn: thread.waitingOn,
    workRemaining: thread.workRemaining,
    waitTicks: thread.waitTicks,
    busyWaitTicks: thread.busyWaitTicks,
  };
}

/**
 * Mengubah state thread. Mengembalikan event THREAD_STATE, atau null bila state
 * tidak berubah (mis. RUNNING -> RUNNING). Melempar error untuk transisi tidak sah.
 */
export function transition(
  thread: ThreadRuntime,
  to: ThreadState,
  tick: number,
): SimEvent | null {
  const from = thread.state;

  if (from === to) return null;

  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new Error(
      `Transisi state tidak sah pada thread "${thread.def.id}": ${from} -> ${to}`,
    );
  }

  thread.state = to;

  // Keluar dari WAITING berarti tidak lagi menunggu resource apa pun.
  if (from === 'WAITING') thread.waitingOn = null;

  return {
    type: 'THREAD_STATE',
    tick,
    thread: thread.def.id,
    from,
    to,
  };
}

function hasKey(record: Record<string, number>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function readNumber(
  record: Record<string, number>,
  key: string,
  threadId: string,
  kind: string,
): number {
  if (!hasKey(record, key)) {
    throw new Error(
      `Thread "${threadId}" memakai ${kind} "${key}" yang tidak ada`,
    );
  }

  return record[key] as number;
}

function requireMutex(
  sync: SyncContext,
  name: string,
  threadId: string,
): Mutex {
  const mutex = sync.mutexes.get(name);

  if (mutex === undefined) {
    throw new Error(
      `Thread "${threadId}" memakai mutex "${name}" yang tidak ada`,
    );
  }

  return mutex;
}

function requireSemaphore(
  sync: SyncContext,
  name: string,
  threadId: string,
): Semaphore {
  const sem = sync.semaphores?.get(name);

  if (sem === undefined) {
    throw new Error(
      `Thread "${threadId}" memakai semaphore "${name}" yang tidak ada`,
    );
  }

  return sem;
}

function requireCondition(
  sync: SyncContext,
  name: string,
  threadId: string,
): Condition {
  const cond = sync.conditions?.get(name);

  if (cond === undefined) {
    throw new Error(
      `Thread "${threadId}" memakai condition variable "${name}" yang tidak ada`,
    );
  }

  return cond;
}

function requireBuffer(
  sync: SyncContext,
  name: string,
  threadId: ThreadId,
): BoundedBuffer {
  const buffer = sync.buffers?.get(name);

  if (buffer === undefined) {
    throw new Error(`Thread "${threadId}": ban "${name}" tidak dideklarasikan`);
  }

  return buffer;
}

/**
 * Memajukan pc setelah satu instruksi selesai. Bila program habis, pengulangan
 * berikutnya dimulai; bila semua pengulangan habis, thread TERMINATED
 * (thread harus RUNNING saat itu).
 */
function advancePc(thread: ThreadRuntime, tick: number): SimEvent | null {
  thread.pc += 1;

  if (thread.pc < thread.def.program.length) return null;

  thread.pc = 0;
  thread.iteration += 1;

  if (thread.iteration >= (thread.def.repeat ?? 1)) {
    return transition(thread, 'TERMINATED', tick);
  }

  return null;
}

function requireRwLock(
  sync: SyncContext,
  name: string,
  threadId: ThreadId,
): RwLock {
  const lock = sync.rwLocks?.get(name);

  if (lock === undefined) {
    throw new Error(
      `Thread "${threadId}" memakai kunci baca-tulis "${name}" yang tidak ada`,
    );
  }

  return lock;
}

function requireBoard(
  sync: SyncContext,
  name: string,
  threadId: ThreadId,
): Board {
  const board = sync.boards?.get(name);

  if (board === undefined) {
    throw new Error(
      `Thread "${threadId}": papan "${name}" tidak dideklarasikan`,
    );
  }

  return board;
}

/**
 * Thread yang dibangunkan RwLock sudah menjadi pemegang kunci (handoff, seperti
 * mutex): ia READY, instruksi acquire-nya dianggap selesai, dan pc dimajukan.
 */
function wakeRwGranted(
  lock: RwLock,
  lockName: string,
  granted: readonly ThreadId[],
  tick: number,
  sync: SyncContext,
): SimEvent[] {
  const events: SimEvent[] = [];
  const holders = lock.snapshot();

  for (const id of granted) {
    const woken = sync.getThread(id);
    const change = transition(woken, 'READY', tick);

    if (change) events.push(change);

    events.push({
      type: 'RW_ACQUIRED',
      tick,
      thread: id,
      lock: lockName,
      mode: holders.writer === id ? 'write' : 'read',
    });

    const end = advancePc(woken, tick);

    if (end) events.push(end);
  }

  return events;
}

/**
 * Pemilik melepas mutex. Dipakai UNLOCK dan COND_WAIT (yang melepas mutex
 * sebelum tidur). Bila ada thread yang antre, kepemilikan langsung diserahkan
 * (handoff): thread itu dibangunkan dan instruksinya yang memblokir (LOCK atau
 * COND_WAIT) dianggap selesai, jadi pc-nya dimajukan di sini.
 * Melempar error bila `thread` bukan pemilik.
 */
function releaseMutex(
  mutex: Mutex,
  mutexName: string,
  thread: ThreadRuntime,
  tick: number,
  sync: SyncContext,
): SimEvent[] {
  const id = thread.def.id;
  const events: SimEvent[] = [];

  const push = (event: SimEvent | null): void => {
    if (event) events.push(event);
  };

  const next = mutex.unlock(id); // melempar error bila bukan pemilik

  events.push({
    type: 'LOCK_RELEASED',
    tick,
    thread: id,
    mutex: mutexName,
  });

  if (next !== null) {
    const woken = sync.getThread(next);

    push(transition(woken, 'READY', tick));

    events.push({
      type: 'LOCK_ACQUIRED',
      tick,
      thread: next,
      mutex: mutexName,
    });

    push(advancePc(woken, tick));
  }

  return events;
}

/**
 * Membangunkan satu penunggu condition. Penunggu harus mengambil mutex-nya
 * lagi sebelum boleh lanjut:
 * - mutex bebas  -> langsung memegangnya, READY, COND_WAIT selesai;
 * - mutex dipakai -> mengantre di mutex, tetap WAITING (kini menunggu mutex).
 *   COND_WAIT-nya selesai nanti saat mutex diserahkan lewat releaseMutex().
 */
function wakeWaiter(
  waiter: ConditionWaiter,
  tick: number,
  sync: SyncContext,
): SimEvent[] {
  const events: SimEvent[] = [];
  const woken = sync.getThread(waiter.thread);
  const mutex = requireMutex(sync, waiter.mutex, waiter.thread);

  if (mutex.lock(waiter.thread)) {
    const change = transition(woken, 'READY', tick);

    if (change) events.push(change);

    events.push({
      type: 'LOCK_ACQUIRED',
      tick,
      thread: waiter.thread,
      mutex: waiter.mutex,
    });

    const end = advancePc(woken, tick);

    if (end) events.push(end);
  } else {
    const on = `mutex:${waiter.mutex}`;
    woken.waitingOn = on;

    events.push({
      type: 'BLOCKED',
      tick,
      thread: waiter.thread,
      on,
    });
  }

  return events;
}

/**
 * Menjalankan SATU instruksi pada pc saat ini (satu tick), lalu memajukan pc.
 * Thread harus sudah berstatus RUNNING. Mengubah thread, sharedVars, dan
 * (untuk instruksi sinkronisasi) mutex, semaphore, condition, serta thread
 * lain yang dibangunkan.
 *
 * Catatan perilaku:
 * - WORK n membutuhkan n tick; tiap tick tetap menghasilkan event INSTRUCTION.
 * - LOCK pada mutex terpakai membuat thread WAITING dengan pc tetap di LOCK.
 *   Instruksi itu dianggap selesai saat UNLOCK menyerahkan mutex kepadanya
 *   (handoff); saat itu pc-nya dimajukan oleh thread yang melepas.
 * - COND_WAIT melepas mutex lalu tidur di condition (WAITING, pc tetap di
 *   COND_WAIT). Setelah disinyal, ia harus mengambil mutex lagi; COND_WAIT
 *   selesai saat mutex didapat (lihat wakeWaiter). Sinyal tanpa penunggu hilang.
 * - SPIN_UNTIL mengecek variabel bersama tiap tick. Selama nilainya masih di
 *   bawah batas, pc tidak maju dan thread tidak tidur (busy waiting), sehingga
 *   busyWaitTicks bertambah dan core terpakai sia-sia.
 * - Setelah instruksi terakhir selesai, program diulang sampai `repeat`
 *   terpenuhi; setelah itu thread TERMINATED.
 */
export function executeInstruction(
  thread: ThreadRuntime,
  tick: number,
  sharedVars: Record<string, number>,
  sync: SyncContext = EMPTY_SYNC,
): SimEvent[] {
  const id = thread.def.id;
  const index = thread.pc;
  const instruction = thread.def.program[index];

  if (instruction === undefined) {
    throw new Error(
      `Thread "${id}" tidak punya instruksi pada indeks ${index}`,
    );
  }

  const events: SimEvent[] = [
    {
      type: 'INSTRUCTION',
      tick,
      thread: id,
      index,
      op: instruction.op,
    },
  ];

  const push = (event: SimEvent | null): void => {
    if (event) events.push(event);
  };

  let completed = true;

  switch (instruction.op) {
    case 'WORK': {
      if (thread.workRemaining === 0) {
        thread.workRemaining = instruction.ticks;
      }

      thread.workRemaining -= 1;
      completed = thread.workRemaining === 0;
      break;
    }

    case 'READ': {
      // Sengaja terpisah dari WRITE: jeda di antaranya yang memunculkan race condition.
      thread.registers[instruction.into] = readNumber(
        sharedVars,
        instruction.from,
        id,
        'variabel bersama',
      );
      break;
    }

    case 'COMPUTE': {
      const current = readNumber(
        thread.registers,
        instruction.reg,
        id,
        'register',
      );

      thread.registers[instruction.reg] = current + instruction.add;
      break;
    }

    case 'WRITE': {
      const oldValue = readNumber(
        sharedVars,
        instruction.to,
        id,
        'variabel bersama',
      );

      const newValue = readNumber(
        thread.registers,
        instruction.reg,
        id,
        'register',
      );

      sharedVars[instruction.to] = newValue;

      events.push({
        type: 'VAR_WRITTEN',
        tick,
        thread: id,
        name: instruction.to,
        oldValue,
        newValue,
      });

      break;
    }

    case 'LOCK': {
      const mutex = requireMutex(sync, instruction.mutex, id);

      if (mutex.lock(id)) {
        events.push({
          type: 'LOCK_ACQUIRED',
          tick,
          thread: id,
          mutex: instruction.mutex,
        });
      } else {
        completed = false;

        const on = `mutex:${instruction.mutex}`;
        thread.waitingOn = on;

        events.push({
          type: 'BLOCKED',
          tick,
          thread: id,
          on,
        });

        push(transition(thread, 'WAITING', tick));
      }

      break;
    }

    case 'UNLOCK': {
      const mutex = requireMutex(sync, instruction.mutex, id);

      events.push(
        ...releaseMutex(mutex, instruction.mutex, thread, tick, sync),
      );

      break;
    }

    case 'SEM_WAIT': {
      const sem = requireSemaphore(sync, instruction.sem, id);

      if (!sem.wait(id)) {
        completed = false;

        const on = `sem:${instruction.sem}`;
        thread.waitingOn = on;

        events.push({
          type: 'BLOCKED',
          tick,
          thread: id,
          on,
        });

        push(transition(thread, 'WAITING', tick));
      }

      break;
    }

    case 'SEM_SIGNAL': {
      const sem = requireSemaphore(sync, instruction.sem, id);
      const next = sem.signal();

      if (next !== null) {
        const woken = sync.getThread(next);

        push(transition(woken, 'READY', tick));
        push(advancePc(woken, tick));
      }

      break;
    }

    case 'COND_WAIT': {
      const cond = requireCondition(sync, instruction.cond, id);
      const mutex = requireMutex(sync, instruction.mutex, id);

      // 1. Lepas mutex (melempar error bila thread bukan pemiliknya).
      events.push(
        ...releaseMutex(mutex, instruction.mutex, thread, tick, sync),
      );

      // 2. Tidur di condition sampai disinyal.
      cond.wait(id, instruction.mutex);
      completed = false;

      const on = `cond:${instruction.cond}`;
      thread.waitingOn = on;

      events.push({
        type: 'BLOCKED',
        tick,
        thread: id,
        on,
      });

      push(transition(thread, 'WAITING', tick));

      break;
    }

    case 'COND_SIGNAL': {
      const cond = requireCondition(sync, instruction.cond, id);
      const waiter = cond.signal(); // null = tidak ada yang menunggu, sinyal hilang

      if (waiter !== null) {
        events.push(...wakeWaiter(waiter, tick, sync));
      }

      break;
    }

    case 'COND_BROADCAST': {
      const cond = requireCondition(sync, instruction.cond, id);

      for (const waiter of cond.broadcast()) {
        events.push(...wakeWaiter(waiter, tick, sync));
      }

      break;
    }

    case 'ENTER_AREA': {
      sync.enterArea?.(id, instruction.area);

      events.push({
        type: 'AREA_ENTERED',
        tick,
        thread: id,
        area: instruction.area,
      });

      break;
    }

    case 'LEAVE_AREA': {
      sync.leaveArea?.(id, instruction.area);

      events.push({
        type: 'AREA_LEFT',
        tick,
        thread: id,
        area: instruction.area,
      });

      break;
    }

    case 'PUT_ITEM': {
      const buffer = requireBuffer(sync, instruction.buffer, id);

      if (buffer.put()) {
        events.push({
          type: 'BUFFER_PUT',
          tick,
          thread: id,
          buffer: instruction.buffer,
          items: buffer.count,
        });
      } else {
        events.push({
          type: 'BUFFER_OVERFLOW',
          tick,
          thread: id,
          buffer: instruction.buffer,
          capacity: buffer.capacity,
        });
      }

      break;
    }

    case 'TAKE_ITEM': {
      const buffer = requireBuffer(sync, instruction.buffer, id);

      if (buffer.take()) {
        events.push({
          type: 'BUFFER_TAKEN',
          tick,
          thread: id,
          buffer: instruction.buffer,
          items: buffer.count,
        });
      } else {
        events.push({
          type: 'BUFFER_UNDERFLOW',
          tick,
          thread: id,
          buffer: instruction.buffer,
        });
      }

      break;
    }

    case 'RW_ACQUIRE_READ':
    case 'RW_ACQUIRE_WRITE': {
      const lock = requireRwLock(sync, instruction.lock, id);
      const isRead = instruction.op === 'RW_ACQUIRE_READ';
      const granted = isRead ? lock.acquireRead(id) : lock.acquireWrite(id);

      if (granted) {
        events.push({
          type: 'RW_ACQUIRED',
          tick,
          thread: id,
          lock: instruction.lock,
          mode: isRead ? 'read' : 'write',
        });
      } else {
        completed = false;

        const on = `rw:${instruction.lock}`;
        thread.waitingOn = on;

        events.push({ type: 'BLOCKED', tick, thread: id, on });

        push(transition(thread, 'WAITING', tick));
      }

      break;
    }

    case 'RW_RELEASE_READ':
    case 'RW_RELEASE_WRITE': {
      const lock = requireRwLock(sync, instruction.lock, id);
      const isRead = instruction.op === 'RW_RELEASE_READ';
      const granted = isRead ? lock.releaseRead(id) : lock.releaseWrite(id);

      events.push({
        type: 'RW_RELEASED',
        tick,
        thread: id,
        lock: instruction.lock,
        mode: isRead ? 'read' : 'write',
      });
      events.push(
        ...wakeRwGranted(lock, instruction.lock, granted, tick, sync),
      );

      break;
    }

    case 'BOARD_READ': {
      const board = requireBoard(sync, instruction.board, id);

      events.push({
        type: 'BOARD_READ',
        tick,
        thread: id,
        board: instruction.board,
        consistent: board.read(),
      });

      break;
    }

    case 'BOARD_WRITE_START': {
      const board = requireBoard(sync, instruction.board, id);

      events.push({
        type: 'BOARD_WRITE',
        tick,
        thread: id,
        board: instruction.board,
        phase: 'start',
        conflict: board.startWrite(),
      });

      break;
    }

    case 'BOARD_WRITE_END': {
      const board = requireBoard(sync, instruction.board, id);

      board.endWrite();

      events.push({
        type: 'BOARD_WRITE',
        tick,
        thread: id,
        board: instruction.board,
        phase: 'end',
        conflict: false,
      });

      break;
    }

    case 'SPIN_UNTIL': {
      // Busy waiting: thread tetap READY/RUNNING dan memakai core tiap tick
      // selama kondisi belum terpenuhi. Beda dengan WAITING (tidur, tanpa core).
      // Tick pengecekan yang gagal dihitung sebagai busyWaitTicks; tick
      // pengecekan yang berhasil sudah dianggap pekerjaan biasa.
      const current = readNumber(
        sharedVars,
        instruction.variable,
        id,
        'variabel bersama',
      );

      if (current < instruction.atLeast) {
        completed = false;
        thread.busyWaitTicks += 1;
      }

      break;
    }

    default: {
      // Semua instruksi sudah ditangani; bila union Instruction bertambah,
      // TypeScript akan menandai baris ini sebagai error.
      const unhandled: never = instruction;

      throw new Error(
        `Instruksi belum didukung engine: ${JSON.stringify(unhandled)}`,
      );
    }
  }

  if (completed) push(advancePc(thread, tick));

  return events;
}
