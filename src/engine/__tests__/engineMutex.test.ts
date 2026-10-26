import { describe, it, expect } from 'vitest';
import { Engine } from '../engine';
import { computeMetrics } from '../metrics';
import type {
  EngineConfig,
  Instruction,
  SchedulerConfig,
  SimEvent,
  ThreadDef,
} from '../types';

const EXPECTED = { variable: 'stok', value: 10 };

/** Level 1-1 dengan mutex menutupi READ -> COMPUTE -> WRITE. */
function safeProgram(work = 1): Instruction[] {
  return [
    { op: 'WORK', ticks: work },
    { op: 'LOCK', mutex: 'papan' },
    { op: 'READ', from: 'stok', into: 'r' },
    { op: 'COMPUTE', reg: 'r', add: 1 },
    { op: 'WRITE', reg: 'r', to: 'stok' },
    { op: 'UNLOCK', mutex: 'papan' },
  ];
}

/** Mutex terlalu besar: ikut menutupi proses merakit (WORK). */
function bigLockProgram(work: number): Instruction[] {
  return [
    { op: 'LOCK', mutex: 'papan' },
    { op: 'WORK', ticks: work },
    { op: 'READ', from: 'stok', into: 'r' },
    { op: 'COMPUTE', reg: 'r', add: 1 },
    { op: 'WRITE', reg: 'r', to: 'stok' },
    { op: 'UNLOCK', mutex: 'papan' },
  ];
}

function makeConfig(
  program: Instruction[],
  repeat: number,
  scheduler: SchedulerConfig = { kind: 'random', cores: 1 },
  overrides: Partial<EngineConfig> = {},
): EngineConfig {
  const threads: ThreadDef[] = ['A', 'B'].map((id) => ({
    id,
    label: `Robot ${id}`,
    program,
    repeat,
  }));
  return {
    threads,
    sharedVars: { stok: 0 },
    mutexes: ['papan'],
    semaphores: {},
    conditions: [],
    scheduler,
    maxTicks: 2000,
    ...overrides,
  };
}

function run(
  config: EngineConfig,
  seed: number,
): { engine: Engine; events: SimEvent[] } {
  const engine = new Engine();
  engine.load(config, seed);
  const events: SimEvent[] = [];
  while (!engine.isFinished) events.push(...engine.step().events);
  return { engine, events };
}

describe('Level 1-1 dengan mutex (inti T-021)', () => {
  const config = makeConfig(safeProgram(), 5);

  it('stok akhir = target (10) dan tidak ada pembaruan hilang pada 1.000 seed', () => {
    for (let seed = 1; seed <= 1000; seed++) {
      const { engine } = run(config, seed);
      const snap = engine.getSnapshot();
      expect(snap.sharedVars.stok).toBe(10);
      expect(computeMetrics(snap, EXPECTED).lostUpdates).toBe(0);
      expect(snap.threads.every((t) => t.state === 'TERMINATED')).toBe(true);
    }
  });

  it('mutex tidak pernah dimiliki dua thread: LOCK_ACQUIRED dan LOCK_RELEASED selalu bergantian', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { events } = run(config, seed);
      let holder: string | null = null;
      for (const e of events) {
        if (e.type === 'LOCK_ACQUIRED') {
          expect(holder).toBeNull();
          holder = e.thread;
        } else if (e.type === 'LOCK_RELEASED') {
          expect(holder).toBe(e.thread);
          holder = null;
        }
      }
      expect(holder).toBeNull();
    }
  });

  it('pada seed 10 (yang merusak stok tanpa mutex) hasilnya kini benar, dengan waktu tunggu > 0', () => {
    const { engine } = run(config, 10);
    const metrics = computeMetrics(engine.getSnapshot(), EXPECTED);
    expect(engine.getSnapshot().sharedVars.stok).toBe(10);
    expect(metrics.maxWaitTicks).toBeGreaterThan(0);
  });

  it('seed sama menghasilkan event identik', () => {
    expect(run(config, 77).events).toEqual(run(config, 77).events);
  });

  it('mutex harus dilepas: snapshot akhir menunjukkan mutex bebas dan antrean kosong', () => {
    const { engine } = run(config, 3);
    expect(engine.getSnapshot().mutexes).toEqual([
      { id: 'papan', owner: null, queue: [] },
    ]);
  });
});

describe('Engine + mutex: jalannya blokir dan handoff (jadwal terkontrol)', () => {
  // A: WORK, LOCK -> B: WORK, LOCK (diblokir) -> A: READ, COMPUTE, WRITE, UNLOCK
  const script = ['A', 'A', 'B', 'B', 'A', 'A', 'A', 'A'];
  const config = makeConfig(safeProgram(), 1, {
    kind: 'scripted',
    cores: 1,
    script,
  });

  it('B diblokir saat mutex dipegang A: WAITING, menunggu mutex:papan, antre di mutex', () => {
    const engine = new Engine();
    engine.load(config, 1);
    for (let i = 0; i < 4; i++) engine.step();

    const snap = engine.getSnapshot();
    const b = snap.threads.find((t) => t.id === 'B');
    expect(b?.state).toBe('WAITING');
    expect(b?.waitingOn).toBe('mutex:papan');
    expect(b?.pc).toBe(1); // tetap di instruksi LOCK
    expect(snap.mutexes).toEqual([{ id: 'papan', owner: 'A', queue: ['B'] }]);
  });

  it('thread WAITING tidak dipilih scheduler walau ada di script', () => {
    const engine = new Engine();
    engine.load(
      makeConfig(safeProgram(), 1, {
        kind: 'scripted',
        cores: 1,
        script: ['A', 'A', 'B', 'B', 'B', 'B', 'A', 'A', 'A', 'A'],
      }),
      1,
    );
    for (let i = 0; i < 4; i++) engine.step(); // B sudah diblokir
    // Dua entri 'B' berikutnya dilewati; yang berjalan adalah A
    const { events } = engine.step();
    const ran = events.filter((e) => e.type === 'INSTRUCTION');
    expect(ran).toHaveLength(1);
    expect(ran[0]).toMatchObject({ thread: 'A', op: 'READ' });
  });

  it('UNLOCK oleh A menyerahkan mutex ke B (handoff), dan waktu tunggu B terhitung', () => {
    const engine = new Engine();
    engine.load(config, 1);
    let unlockEvents: SimEvent[] = [];
    for (let i = 0; i < 8; i++) {
      const { events } = engine.step();
      if (i === 7) unlockEvents = events;
    }

    expect(unlockEvents).toContainEqual({
      type: 'LOCK_RELEASED',
      tick: 8,
      thread: 'A',
      mutex: 'papan',
    });
    expect(unlockEvents).toContainEqual({
      type: 'LOCK_ACQUIRED',
      tick: 8,
      thread: 'B',
      mutex: 'papan',
    });

    const snap = engine.getSnapshot();
    const b = snap.threads.find((t) => t.id === 'B');
    expect(b?.state).toBe('READY');
    expect(b?.pc).toBe(2); // sudah melewati LOCK
    expect(snap.mutexes).toEqual([{ id: 'papan', owner: 'B', queue: [] }]);
    // B menunggu selama A berada di critical section (tick 5 sampai 8)
    expect(b?.waitTicks).toBe(4);
  });

  it('simulasi tuntas dengan stok benar', () => {
    const { engine } = run(config, 1);
    expect(engine.getSnapshot().sharedVars.stok).toBe(2);
  });
});

describe('Engine + mutex: kesalahan dan batas', () => {
  it('thread selesai sambil memegang mutex melempar error jelas', () => {
    const leaky: Instruction[] = [
      { op: 'LOCK', mutex: 'papan' },
      { op: 'WORK', ticks: 1 },
    ];
    const engine = new Engine();
    engine.load(
      makeConfig(
        leaky,
        1,
        { kind: 'scripted', cores: 1, script: ['A', 'A'] },
        {
          threads: [{ id: 'A', label: 'A', program: leaky }],
        },
      ),
      1,
    );
    engine.step();
    expect(() => engine.step()).toThrow(
      /masih memegang mutex "papan".*tidak seimbang/,
    );
  });

  it('dua thread yang saling menunggu: simulasi berhenti (belum ada deteksi deadlock sampai T-055)', () => {
    const lockOrder = (first: string, second: string): Instruction[] => [
      { op: 'LOCK', mutex: first },
      { op: 'LOCK', mutex: second },
      { op: 'UNLOCK', mutex: second },
      { op: 'UNLOCK', mutex: first },
    ];
    const config = makeConfig(
      lockOrder('m1', 'm2'),
      1,
      { kind: 'scripted', cores: 1, script: ['A', 'B'] },
      {
        threads: [
          { id: 'A', label: 'A', program: lockOrder('m1', 'm2') },
          { id: 'B', label: 'B', program: lockOrder('m2', 'm1') },
        ],
        mutexes: ['m1', 'm2'],
      },
    );
    const { engine } = run(config, 1);
    const snap = engine.getSnapshot();
    expect(snap.finished).toBe(true);
    expect(snap.threads.map((t) => t.state)).toEqual(['WAITING', 'WAITING']);
    expect(snap.tick).toBeLessThan(10); // berhenti segera, bukan menunggu maxTicks
  });

  it('reset mengembalikan mutex ke keadaan awal', () => {
    const engine = new Engine();
    engine.load(makeConfig(safeProgram(), 5), 1);
    for (let i = 0; i < 12; i++) engine.step();
    engine.reset();
    expect(engine.getSnapshot().mutexes).toEqual([
      { id: 'papan', owner: null, queue: [] },
    ]);
  });

  it('konfigurasi: mutex tidak dideklarasikan, nama ganda, dan LOCK sebagai instruksi terakhir ditolak', () => {
    const engine = new Engine();
    expect(() =>
      engine.load(makeConfig(safeProgram(), 1, undefined, { mutexes: [] }), 1),
    ).toThrow(/mutex "papan" tidak dideklarasikan/);
    expect(() =>
      engine.load(
        makeConfig(safeProgram(), 1, undefined, {
          mutexes: ['papan', 'papan'],
        }),
        1,
      ),
    ).toThrow(/ganda/);
    expect(() =>
      engine.load(
        makeConfig(
          [
            { op: 'WORK', ticks: 1 },
            { op: 'LOCK', mutex: 'papan' },
          ],
          1,
        ),
        1,
      ),
    ).toThrow(/tidak boleh LOCK/);
  });
});

describe('Engine + mutex: harga pengaman terhadap total waktu (bahan Level 1-2)', () => {
  const ticksOf = (
    program: Instruction[],
    cores: number,
    seed: number,
  ): number =>
    run(
      makeConfig(program, 5, { kind: 'random', cores }),
      seed,
    ).engine.getSnapshot().tick;

  it('cores = 1: mutex besar atau kecil memakan total tick yang sama (selalu ada thread yang jalan)', () => {
    for (let seed = 1; seed <= 20; seed++) {
      expect(ticksOf(bigLockProgram(3), 1, seed)).toBe(
        ticksOf(safeProgram(3), 1, seed),
      );
    }
  });

  it('cores = 2: mutex yang ikut menutupi WORK memperlambat simulasi', () => {
    for (let seed = 1; seed <= 20; seed++) {
      expect(ticksOf(bigLockProgram(3), 2, seed)).toBeGreaterThan(
        ticksOf(safeProgram(3), 2, seed),
      );
    }
  });
});
