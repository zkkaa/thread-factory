import type {
  SimEvent,
  ThreadDef,
  ThreadSnapshot,
  ThreadState,
} from './types';

/**
 * Keadaan sebuah thread selama simulasi berjalan.
 * Objek ini dimiliki dan diubah HANYA oleh Engine; pihak luar hanya melihat
 * salinannya lewat snapshotThread().
 */
export interface ThreadRuntime {
  readonly def: ThreadDef;
  state: ThreadState;
  /** Indeks instruksi berikutnya. */
  pc: number;
  /** Pengulangan program ke berapa (mulai 0). */
  iteration: number;
  registers: Record<string, number>;
  waitingOn: string | null;
  /** Sisa tick untuk instruksi WORK yang sedang berjalan (0 = tidak sedang WORK). */
  workRemaining: number;
  waitTicks: number;
}

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
  return { type: 'THREAD_STATE', tick, thread: thread.def.id, from, to };
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
    throw new Error(`Thread "${threadId}" memakai ${kind} "${key}" yang tidak ada`);
  }
  return record[key] as number;
}

/**
 * Menjalankan SATU instruksi pada pc saat ini (satu tick), lalu memajukan pc.
 * Thread harus sudah berstatus RUNNING. Mengubah thread dan sharedVars.
 *
 * Catatan perilaku:
 * - WORK n membutuhkan n tick; tiap tick tetap menghasilkan event INSTRUCTION.
 * - Setelah instruksi terakhir selesai, program diulang sampai `repeat`
 *   terpenuhi; setelah itu thread TERMINATED.
 */
export function executeInstruction(
  thread: ThreadRuntime,
  tick: number,
  sharedVars: Record<string, number>,
): SimEvent[] {
  const id = thread.def.id;
  const index = thread.pc;
  const instruction = thread.def.program[index];
  if (instruction === undefined) {
    throw new Error(`Thread "${id}" tidak punya instruksi pada indeks ${index}`);
  }

  const events: SimEvent[] = [
    { type: 'INSTRUCTION', tick, thread: id, index, op: instruction.op },
  ];
  let completed = true;

  switch (instruction.op) {
    case 'WORK': {
      if (thread.workRemaining === 0) thread.workRemaining = instruction.ticks;
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
      const current = readNumber(thread.registers, instruction.reg, id, 'register');
      thread.registers[instruction.reg] = current + instruction.add;
      break;
    }
    case 'WRITE': {
      const oldValue = readNumber(sharedVars, instruction.to, id, 'variabel bersama');
      const newValue = readNumber(thread.registers, instruction.reg, id, 'register');
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
    default:
      throw new Error(
        `Instruksi ${instruction.op} belum didukung engine ` +
          `(mutex: T-018, semaphore: T-040, condition variable: T-044)`,
      );
  }

  if (completed) {
    thread.pc += 1;
    if (thread.pc >= thread.def.program.length) {
      thread.pc = 0;
      thread.iteration += 1;
      if (thread.iteration >= (thread.def.repeat ?? 1)) {
        const event = transition(thread, 'TERMINATED', tick);
        if (event) events.push(event);
      }
    }
  }
  return events;
}
