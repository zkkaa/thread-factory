import { describe, expect, it } from 'vitest';
import { Engine } from '../engine';
import { Condition } from '../primitives/condition';
import { Mutex } from '../primitives/mutex';
import {
  createThread,
  executeInstruction,
  transition,
  type SyncContext,
  type ThreadRuntime,
} from '../thread';
import type { EngineConfig, Instruction, SimEvent, ThreadDef } from '../types';
import { validateConfig } from '../validateConfig';

// ---------------------------------------------------------------------------
// Program contoh (mutex "m", condition "c")
// ---------------------------------------------------------------------------

const WAITER: Instruction[] = [
  { op: 'LOCK', mutex: 'm' },
  { op: 'COND_WAIT', cond: 'c', mutex: 'm' },
  { op: 'UNLOCK', mutex: 'm' },
  { op: 'WORK', ticks: 1 },
];
const SIGNAL_BARE: Instruction[] = [
  { op: 'COND_SIGNAL', cond: 'c' },
  { op: 'WORK', ticks: 1 },
];
const SIGNAL_HOLDING: Instruction[] = [
  { op: 'LOCK', mutex: 'm' },
  { op: 'COND_SIGNAL', cond: 'c' },
  { op: 'UNLOCK', mutex: 'm' },
  { op: 'WORK', ticks: 1 },
];
const BROADCAST_HOLDING: Instruction[] = [
  { op: 'LOCK', mutex: 'm' },
  { op: 'COND_BROADCAST', cond: 'c' },
  { op: 'UNLOCK', mutex: 'm' },
  { op: 'WORK', ticks: 1 },
];

function def(id: string, program: Instruction[]): ThreadDef {
  return { id, label: id, program };
}

/**
 * Dunia mini tanpa scheduler: tes memilih sendiri thread mana yang menjalankan
 * satu instruksi, sehingga urutannya pasti dan tidak bergantung pada seed.
 */
function createWorld(defs: ThreadDef[]) {
  const threads = new Map<string, ThreadRuntime>(
    defs.map((d) => [d.id, createThread(d)]),
  );
  function thread(id: string): ThreadRuntime {
    const t = threads.get(id);
    if (t === undefined) throw new Error(`Thread tes tidak ada: ${id}`);
    return t;
  }
  const mutex = new Mutex('m');
  const condition = new Condition('c');
  const sync: SyncContext = {
    mutexes: new Map([['m', mutex]]),
    conditions: new Map([['c', condition]]),
    getThread: thread,
  };
  for (const t of threads.values()) transition(t, 'READY', 0);

  let tick = 0;
  /** Thread `id` menjalankan SATU instruksi. */
  function run(id: string): SimEvent[] {
    tick += 1;
    const t = thread(id);
    transition(t, 'RUNNING', tick); // null bila sudah RUNNING
    return executeInstruction(t, tick, {}, sync);
  }
  return { thread, mutex, condition, run };
}

// ---------------------------------------------------------------------------
// Kelas Condition
// ---------------------------------------------------------------------------

describe('Condition (antrean tunggu)', () => {
  it('signal() mengeluarkan penunggu sesuai urutan FIFO', () => {
    const c = new Condition('c');
    c.wait('a', 'm');
    c.wait('b', 'm');
    expect(c.signal()).toEqual({ thread: 'a', mutex: 'm' });
    expect(c.snapshot().queue).toEqual(['b']);
    expect(c.signal()).toEqual({ thread: 'b', mutex: 'm' });
  });

  it('signal() pada antrean kosong mengembalikan null (sinyal hilang)', () => {
    expect(new Condition('c').signal()).toBeNull();
  });

  it('broadcast() mengeluarkan semua penunggu berurutan dan mengosongkan antrean', () => {
    const c = new Condition('c');
    c.wait('a', 'm');
    c.wait('b', 'm');
    c.wait('x', 'm');
    expect(c.broadcast().map((w) => w.thread)).toEqual(['a', 'b', 'x']);
    expect(c.snapshot().queue).toEqual([]);
  });

  it('thread yang sudah menunggu tidak boleh wait() lagi', () => {
    const c = new Condition('c');
    c.wait('a', 'm');
    expect(() => c.wait('a', 'm')).toThrow(/sudah menunggu/);
  });

  it('snapshot() adalah salinan', () => {
    const c = new Condition('c');
    c.wait('a', 'm');
    const snap = c.snapshot();
    snap.queue.push('hantu');
    expect(c.snapshot().queue).toEqual(['a']);
  });
});

// ---------------------------------------------------------------------------
// Instruksi COND_WAIT / COND_SIGNAL / COND_BROADCAST
// ---------------------------------------------------------------------------

describe('COND_WAIT', () => {
  it('melepas mutex, lalu thread tidur (WAITING) di condition', () => {
    const w = createWorld([def('A', WAITER)]);
    w.run('A'); // LOCK
    const events = w.run('A'); // COND_WAIT

    expect(w.mutex.snapshot().owner).toBeNull();
    expect(w.condition.snapshot().queue).toEqual(['A']);
    expect(w.thread('A').state).toBe('WAITING');
    expect(w.thread('A').waitingOn).toBe('cond:c');
    expect(w.thread('A').pc).toBe(1); // pc tetap di COND_WAIT
    expect(events.map((e) => e.type)).toEqual([
      'INSTRUCTION',
      'LOCK_RELEASED',
      'BLOCKED',
      'THREAD_STATE',
    ]);
  });

  it('menyerahkan mutex ke thread yang sedang antre di LOCK', () => {
    const w = createWorld([
      def('A', WAITER),
      def('B', [
        { op: 'LOCK', mutex: 'm' },
        { op: 'UNLOCK', mutex: 'm' },
        { op: 'WORK', ticks: 1 },
      ]),
    ]);
    w.run('A'); // A pegang mutex
    w.run('B'); // B antre di LOCK
    expect(w.thread('B').state).toBe('WAITING');

    w.run('A'); // COND_WAIT: mutex diserahkan ke B

    expect(w.mutex.snapshot().owner).toBe('B');
    expect(w.thread('B').state).toBe('READY');
    expect(w.thread('B').pc).toBe(1); // LOCK-nya selesai
  });

  it('melempar error bila thread bukan pemilik mutex', () => {
    const w = createWorld([
      def('A', [
        { op: 'COND_WAIT', cond: 'c', mutex: 'm' },
        { op: 'WORK', ticks: 1 },
      ]),
    ]);
    expect(() => w.run('A')).toThrow(/bukan miliknya/);
  });

  it('melempar error bila condition tidak ada di konteks', () => {
    const t = createThread(def('A', WAITER));
    transition(t, 'READY', 0);
    transition(t, 'RUNNING', 1);
    t.pc = 1; // langsung ke COND_WAIT
    const sync: SyncContext = {
      mutexes: new Map([['m', new Mutex('m')]]),
      getThread: () => t,
    };
    expect(() => executeInstruction(t, 1, {}, sync)).toThrow(
      /condition variable "c" yang tidak ada/,
    );
  });
});

describe('COND_SIGNAL', () => {
  it('membangunkan satu penunggu terdepan; mutex bebas langsung dipegang', () => {
    const w = createWorld([
      def('W1', WAITER),
      def('W2', WAITER),
      def('S', SIGNAL_BARE),
    ]);
    w.run('W1');
    w.run('W1'); // W1 tidur
    w.run('W2');
    w.run('W2'); // W2 tidur
    expect(w.condition.snapshot().queue).toEqual(['W1', 'W2']);

    const events = w.run('S'); // sinyal tanpa memegang mutex

    expect(w.thread('W1').state).toBe('READY');
    expect(w.thread('W1').pc).toBe(2); // COND_WAIT selesai
    expect(w.mutex.snapshot().owner).toBe('W1');
    expect(w.thread('W2').state).toBe('WAITING'); // tidak ikut bangun
    expect(w.condition.snapshot().queue).toEqual(['W2']);
    expect(
      events.some((e) => e.type === 'LOCK_ACQUIRED' && e.thread === 'W1'),
    ).toBe(true);
  });

  it('bila pemberi sinyal masih memegang mutex, penunggu antre di mutex dulu', () => {
    const w = createWorld([def('W', WAITER), def('S', SIGNAL_HOLDING)]);
    w.run('W');
    w.run('W'); // W tidur
    w.run('S'); // LOCK
    w.run('S'); // COND_SIGNAL

    // W sudah keluar dari condition, tetapi belum boleh jalan.
    expect(w.condition.snapshot().queue).toEqual([]);
    expect(w.thread('W').state).toBe('WAITING');
    expect(w.thread('W').waitingOn).toBe('mutex:m');
    expect(w.mutex.snapshot()).toEqual({ id: 'm', owner: 'S', queue: ['W'] });

    w.run('S'); // UNLOCK: mutex diserahkan ke W
    expect(w.mutex.snapshot().owner).toBe('W');
    expect(w.thread('W').state).toBe('READY');
    expect(w.thread('W').pc).toBe(2);
  });

  it('sinyal tanpa penunggu hilang (tidak diingat)', () => {
    const w = createWorld([def('S', SIGNAL_BARE), def('W', WAITER)]);
    w.run('S'); // sinyal lebih dulu: tidak ada yang menunggu
    w.run('W');
    w.run('W'); // W baru tidur sesudahnya

    expect(w.thread('W').state).toBe('WAITING'); // tidak ada yang membangunkan
    expect(w.condition.snapshot().queue).toEqual(['W']);
  });
});

describe('COND_BROADCAST', () => {
  it('membangunkan semua penunggu; mereka mengambil mutex satu per satu (FIFO)', () => {
    const w = createWorld([
      def('W1', WAITER),
      def('W2', WAITER),
      def('S', BROADCAST_HOLDING),
    ]);
    w.run('W1');
    w.run('W1');
    w.run('W2');
    w.run('W2');
    w.run('S'); // LOCK
    w.run('S'); // COND_BROADCAST

    expect(w.condition.snapshot().queue).toEqual([]);
    expect(w.mutex.snapshot()).toEqual({
      id: 'm',
      owner: 'S',
      queue: ['W1', 'W2'],
    });

    w.run('S'); // UNLOCK -> W1
    expect(w.mutex.snapshot().owner).toBe('W1');
    expect(w.thread('W2').state).toBe('WAITING');

    w.run('W1'); // UNLOCK -> W2
    expect(w.mutex.snapshot().owner).toBe('W2');
    expect(w.thread('W2').state).toBe('READY');
  });
});

// ---------------------------------------------------------------------------
// validateConfig
// ---------------------------------------------------------------------------

function configWith(program: Instruction[], conditions = ['c']): EngineConfig {
  return {
    threads: [def('a', program)],
    sharedVars: {},
    mutexes: ['m'],
    semaphores: {},
    conditions,
    scheduler: { kind: 'random', cores: 1 },
    maxTicks: 100,
  };
}

describe('validateConfig untuk condition', () => {
  it('menerima program yang benar', () => {
    expect(() => validateConfig(configWith(WAITER))).not.toThrow();
  });

  it('menolak nama condition ganda', () => {
    expect(() => validateConfig(configWith(WAITER, ['c', 'c']))).toThrow(
      /Nama condition ganda/,
    );
  });

  it('menolak condition yang tidak dideklarasikan', () => {
    const program: Instruction[] = [
      { op: 'COND_SIGNAL', cond: 'x' },
      { op: 'WORK', ticks: 1 },
    ];
    expect(() => validateConfig(configWith(program))).toThrow(
      /condition "x" tidak dideklarasikan/,
    );
  });

  it('menolak COND_WAIT dengan mutex yang tidak dideklarasikan', () => {
    const program: Instruction[] = [
      { op: 'COND_WAIT', cond: 'c', mutex: 'z' },
      { op: 'WORK', ticks: 1 },
    ];
    expect(() => validateConfig(configWith(program))).toThrow(
      /mutex "z" tidak dideklarasikan/,
    );
  });

  it('menolak COND_WAIT sebagai instruksi terakhir', () => {
    const program: Instruction[] = [
      { op: 'LOCK', mutex: 'm' },
      { op: 'COND_WAIT', cond: 'c', mutex: 'm' },
    ];
    expect(() => validateConfig(configWith(program))).toThrow(
      /instruksi terakhir tidak boleh COND_WAIT/,
    );
  });
});

// ---------------------------------------------------------------------------
// Integrasi lewat Engine
// ---------------------------------------------------------------------------

describe('Engine dengan condition variable', () => {
  const config: EngineConfig = {
    threads: [
      def('waiter', WAITER),
      def('signaler', [
        { op: 'WORK', ticks: 1 },
        { op: 'LOCK', mutex: 'm' },
        { op: 'COND_SIGNAL', cond: 'c' },
        { op: 'UNLOCK', mutex: 'm' },
      ]),
    ],
    sharedVars: {},
    mutexes: ['m'],
    semaphores: {},
    conditions: ['c'],
    scheduler: { kind: 'random', cores: 1 },
    maxTicks: 100,
  };

  function runToEnd(seed: number) {
    const engine = new Engine();
    engine.load(config, seed);
    while (!engine.isFinished) engine.step();
    return engine.getSnapshot();
  }

  it('tiap seed berakhir selesai semua, atau waiter terjebak karena sinyal hilang', () => {
    let completed = 0;
    let lostSignal = 0;

    for (let seed = 1; seed <= 200; seed += 1) {
      const snap = runToEnd(seed);
      expect(snap.mutexes[0]?.owner).toBeNull(); // mutex tidak pernah bocor

      if (snap.threads.every((t) => t.state === 'TERMINATED')) {
        completed += 1;
      } else {
        lostSignal += 1;
        const waiter = snap.threads.find((t) => t.id === 'waiter');
        expect(waiter?.state).toBe('WAITING');
        expect(waiter?.waitingOn).toBe('cond:c');
        expect(snap.conditions[0]?.queue).toEqual(['waiter']);
      }
    }

    // Kedua urutan interleaving harus pernah muncul pada 200 seed.
    expect(completed).toBeGreaterThan(0);
    expect(lostSignal).toBeGreaterThan(0);
  });

  it('seed yang sama menghasilkan hasil yang sama persis', () => {
    expect(runToEnd(7)).toEqual(runToEnd(7));
  });
});
