import { describe, it, expect } from 'vitest';
import { Engine } from '../engine';
import type { EngineConfig, SchedulerConfig, SimEvent, ThreadDef } from '../types';

/** Dua robot seperti Level 1-1: WORK -> READ -> COMPUTE -> WRITE, diulang. */
function robot(id: string, repeat: number, work = 1): ThreadDef {
  return {
    id,
    label: `Robot ${id}`,
    repeat,
    program: [
      { op: 'WORK', ticks: work },
      { op: 'READ', from: 'stok', into: 'r' },
      { op: 'COMPUTE', reg: 'r', add: 1 },
      { op: 'WRITE', reg: 'r', to: 'stok' },
    ],
  };
}

function makeConfig(
  scheduler: SchedulerConfig = { kind: 'random', cores: 1 },
  overrides: Partial<EngineConfig> = {},
): EngineConfig {
  return {
    threads: [robot('A', 5), robot('B', 5)],
    sharedVars: { stok: 0 },
    mutexes: [],
    semaphores: {},
    conditions: [],
    scheduler,
    maxTicks: 1000,
    ...overrides,
  };
}

function runToEnd(engine: Engine): SimEvent[] {
  const all: SimEvent[] = [];
  let guard = 0;
  while (!engine.isFinished) {
    all.push(...engine.step().events);
    if (++guard > 5000) throw new Error('simulasi tidak berhenti');
  }
  return all;
}

function finalStock(seed: number): number {
  const engine = new Engine();
  engine.load(makeConfig(), seed);
  runToEnd(engine);
  return engine.getSnapshot().sharedVars.stok as number;
}

describe('Engine: load dan snapshot awal', () => {
  it('memanggil step/getSnapshot/reset sebelum load melempar error', () => {
    const engine = new Engine();
    expect(() => engine.step()).toThrow(/load/);
    expect(() => engine.getSnapshot()).toThrow(/load/);
    expect(() => engine.reset()).toThrow(/load/);
  });

  it('snapshot awal: tick 0, thread NEW, variabel bersama sesuai konfigurasi', () => {
    const engine = new Engine();
    engine.load(
      makeConfig({ kind: 'random', cores: 1 }, {
        mutexes: ['papan'],
        semaphores: { mesin: 3 },
        conditions: ['sinyal'],
      }),
      7,
    );
    const snap = engine.getSnapshot();
    expect(snap.tick).toBe(0);
    expect(snap.seed).toBe(7);
    expect(snap.finished).toBe(false);
    expect(snap.threads.map((t) => t.state)).toEqual(['NEW', 'NEW']);
    expect(snap.sharedVars).toEqual({ stok: 0 });
    expect(snap.mutexes).toEqual([{ id: 'papan', owner: null, queue: [] }]);
    expect(snap.semaphores).toEqual([{ id: 'mesin', value: 3, queue: [] }]);
    expect(snap.conditions).toEqual([{ id: 'sinyal', queue: [] }]);
  });

  it('snapshot adalah salinan: mengubahnya tidak memengaruhi engine', () => {
    const engine = new Engine();
    engine.load(makeConfig(), 1);
    const snap = engine.getSnapshot() as { sharedVars: Record<string, number> };
    snap.sharedVars.stok = 999;
    expect(engine.getSnapshot().sharedVars.stok).toBe(0);
  });

  it('konfigurasi tidak valid ditolak dengan pesan jelas', () => {
    const engine = new Engine();
    expect(() =>
      engine.load(makeConfig(undefined, { threads: [robot('A', 1), robot('A', 1)] }), 1),
    ).toThrow(/ganda/);
    expect(() => engine.load(makeConfig(undefined, { maxTicks: 0 }), 1)).toThrow(/maxTicks/);
    expect(() => engine.load(makeConfig({ kind: 'random', cores: 0 }), 1)).toThrow(/cores/);
    expect(() =>
      engine.load(makeConfig({ kind: 'scripted', cores: 1, script: ['Z'] }), 1),
    ).toThrow(/"Z"/);
    expect(() => engine.load(makeConfig(), Number.NaN)).toThrow(RangeError);
  });

  it('load yang gagal tidak merusak simulasi yang sedang dimuat', () => {
    const engine = new Engine();
    engine.load(makeConfig(), 1);
    engine.step();
    expect(() => engine.load(makeConfig(undefined, { maxTicks: 0 }), 1)).toThrow();
    expect(engine.getSnapshot().tick).toBe(1);
  });
});

describe('Engine: step dan state machine', () => {
  it('tick pertama memasukkan semua thread ke READY lalu satu menjadi RUNNING', () => {
    const engine = new Engine();
    engine.load(makeConfig(), 1);
    const { tick, events } = engine.step();
    expect(tick).toBe(1);

    const admitted = events.filter(
      (e) => e.type === 'THREAD_STATE' && e.from === 'NEW' && e.to === 'READY',
    );
    expect(admitted).toHaveLength(2);

    const states = engine.getSnapshot().threads.map((t) => t.state).sort();
    expect(states).toEqual(['READY', 'RUNNING']);
  });

  it('cores = 1: tiap tick tepat satu instruksi dieksekusi', () => {
    const engine = new Engine();
    engine.load(makeConfig(), 3);
    for (let i = 0; i < 10; i++) {
      const { events } = engine.step();
      expect(events.filter((e) => e.type === 'INSTRUCTION')).toHaveLength(1);
    }
  });

  it('cores = 2: dua thread mengeksekusi instruksi pada tick yang sama', () => {
    const engine = new Engine();
    engine.load(makeConfig({ kind: 'random', cores: 2 }), 3);
    const { events } = engine.step();
    expect(events.filter((e) => e.type === 'INSTRUCTION')).toHaveLength(2);
    const running = engine.getSnapshot().threads.filter((t) => t.state === 'RUNNING');
    expect(running).toHaveLength(2);
  });

  it('thread yang tidak terpilih turun ke READY (di-"bekukan")', () => {
    const engine = new Engine();
    engine.load(makeConfig({ kind: 'scripted', cores: 1, script: ['A', 'B'] }), 1);
    engine.step();
    expect(engine.getSnapshot().threads.map((t) => t.state)).toEqual(['RUNNING', 'READY']);
    const { events } = engine.step();
    expect(engine.getSnapshot().threads.map((t) => t.state)).toEqual(['READY', 'RUNNING']);
    expect(events).toContainEqual({
      type: 'THREAD_STATE',
      tick: 2,
      thread: 'A',
      from: 'RUNNING',
      to: 'READY',
    });
  });

  it('tanpa thread yang menunggu, simulasi selesai setelah semua instruksi dijalankan', () => {
    const engine = new Engine();
    engine.load(makeConfig(), 11);
    runToEnd(engine);
    const snap = engine.getSnapshot();
    expect(snap.finished).toBe(true);
    expect(snap.threads.every((t) => t.state === 'TERMINATED')).toBe(true);
    // 2 robot x 5 pengulangan x 4 instruksi (WORK 1 tick)
    expect(snap.tick).toBe(40);
    expect(snap.threads.every((t) => t.waitTicks === 0)).toBe(true);
  });

  it('WORK dengan ticks > 1 memperpanjang waktu simulasi', () => {
    const engine = new Engine();
    engine.load(
      makeConfig(undefined, { threads: [robot('A', 1, 3)] }),
      1,
    );
    runToEnd(engine);
    expect(engine.getSnapshot().tick).toBe(6); // 3 (WORK) + READ + COMPUTE + WRITE
  });

  it('event FINISHED dipancarkan sekali, pada tick terakhir', () => {
    const engine = new Engine();
    engine.load(makeConfig(), 5);
    const events = runToEnd(engine);
    const finished = events.filter((e) => e.type === 'FINISHED');
    expect(finished).toEqual([{ type: 'FINISHED', tick: 40 }]);
  });

  it('step setelah selesai tidak melakukan apa-apa', () => {
    const engine = new Engine();
    engine.load(makeConfig(), 5);
    runToEnd(engine);
    const result = engine.step();
    expect(result).toEqual({ tick: 40, events: [], finished: true });
    expect(engine.getSnapshot().tick).toBe(40);
  });

  it('maxTicks menghentikan simulasi lebih awal', () => {
    const engine = new Engine();
    engine.load(makeConfig(undefined, { maxTicks: 10 }), 5);
    runToEnd(engine);
    const snap = engine.getSnapshot();
    expect(snap.tick).toBe(10);
    expect(snap.finished).toBe(true);
    expect(snap.threads.some((t) => t.state !== 'TERMINATED')).toBe(true);
  });

  it('instruksi yang belum didukung (LOCK) menghasilkan error jelas dari step()', () => {
    const engine = new Engine();
    engine.load(
      makeConfig(undefined, {
        threads: [{ id: 'A', label: 'A', program: [{ op: 'LOCK', mutex: 'papan' }] }],
        mutexes: ['papan'],
      }),
      1,
    );
    expect(() => engine.step()).toThrow(/belum didukung/);
  });
});

describe('Engine: race condition muncul alami dari interleaving', () => {
  const twoRobots = (script: string[]): EngineConfig => ({
    threads: [
      { ...robot('A', 1), program: robot('A', 1).program.slice(1) },
      { ...robot('B', 1), program: robot('B', 1).program.slice(1) },
    ],
    sharedVars: { stok: 0 },
    mutexes: [],
    semaphores: {},
    conditions: [],
    scheduler: { kind: 'scripted', cores: 1, script },
    maxTicks: 100,
  });

  it('jadwal selang-seling (A,B,A,B,A,B) menghasilkan lost update: hasil 1, bukan 2', () => {
    const engine = new Engine();
    engine.load(twoRobots(['A', 'B', 'A', 'B', 'A', 'B']), 1);
    runToEnd(engine);
    expect(engine.getSnapshot().sharedVars.stok).toBe(1);
  });

  it('jadwal berurutan (A,A,A,B,B,B) menghasilkan hasil benar: 2', () => {
    const engine = new Engine();
    engine.load(twoRobots(['A', 'A', 'A', 'B', 'B', 'B']), 1);
    runToEnd(engine);
    expect(engine.getSnapshot().sharedVars.stok).toBe(2);
  });

  it('scheduler random: pada sebagian seed ada pembaruan hilang, dan hasil tidak pernah > 10', () => {
    const results = Array.from({ length: 200 }, (_, i) => finalStock(i + 1));
    expect(Math.max(...results)).toBeLessThanOrEqual(10);
    expect(results.some((value) => value < 10)).toBe(true);
  });
});

describe('Engine: determinisme dan reset', () => {
  it('seed sama menghasilkan urutan event identik', () => {
    const run = (seed: number) => {
      const engine = new Engine();
      engine.load(makeConfig(), seed);
      return runToEnd(engine);
    };
    expect(run(2026)).toEqual(run(2026));
  });

  it('seed berbeda menghasilkan jalannya simulasi berbeda', () => {
    const run = (seed: number) => {
      const engine = new Engine();
      engine.load(makeConfig(), seed);
      return runToEnd(engine);
    };
    expect(run(1)).not.toEqual(run(2));
  });

  it('reset() tanpa argumen mengulang simulasi yang sama persis', () => {
    const engine = new Engine();
    engine.load(makeConfig(), 77);
    const first = runToEnd(engine);
    engine.reset();
    expect(engine.getSnapshot().tick).toBe(0);
    expect(engine.isFinished).toBe(false);
    expect(runToEnd(engine)).toEqual(first);
  });

  it('reset(seed) memakai seed baru dan seed itu diingat untuk reset berikutnya', () => {
    const engine = new Engine();
    engine.load(makeConfig(), 1);
    engine.reset(2);
    expect(engine.getSnapshot().seed).toBe(2);
    engine.reset();
    expect(engine.getSnapshot().seed).toBe(2);
  });

  it('reset mengembalikan variabel bersama ke nilai awal', () => {
    const engine = new Engine();
    engine.load(makeConfig(), 1);
    runToEnd(engine);
    expect(engine.getSnapshot().sharedVars.stok).toBeGreaterThan(0);
    engine.reset();
    expect(engine.getSnapshot().sharedVars.stok).toBe(0);
  });

  it('konfigurasi masukan tidak termutasi oleh simulasi', () => {
    const config = makeConfig();
    const copy = JSON.stringify(config);
    const engine = new Engine();
    engine.load(config, 1);
    runToEnd(engine);
    expect(JSON.stringify(config)).toBe(copy);
  });
});
