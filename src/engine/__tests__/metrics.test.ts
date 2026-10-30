import { describe, it, expect } from 'vitest';
import { Engine } from '../engine';
import { computeMetrics } from '../metrics';
import type {
  EngineConfig,
  SchedulerConfig,
  Snapshot,
  ThreadDef,
} from '../types';

function robot(id: string, repeat: number): ThreadDef {
  return {
    id,
    label: `Robot ${id}`,
    repeat,
    program: [
      { op: 'WORK', ticks: 1 },
      { op: 'READ', from: 'stok', into: 'r' },
      { op: 'COMPUTE', reg: 'r', add: 1 },
      { op: 'WRITE', reg: 'r', to: 'stok' },
    ],
  };
}

function makeEngine(
  scheduler: SchedulerConfig,
  seed = 1,
  repeat = 5,
  maxTicks = 1000,
): Engine {
  const config: EngineConfig = {
    threads: [robot('A', repeat), robot('B', repeat)],
    sharedVars: { stok: 0 },
    mutexes: [],
    semaphores: {},
    conditions: [],
    scheduler,
    maxTicks,
  };
  const engine = new Engine();
  engine.load(config, seed);
  return engine;
}

function runToEnd(engine: Engine): void {
  while (!engine.isFinished) engine.step();
}

describe('computeMetrics: throughput', () => {
  it('sebelum simulasi berjalan semuanya nol', () => {
    const engine = makeEngine({ kind: 'random', cores: 1 });
    const m = computeMetrics(engine.getSnapshot());
    expect(m.tick).toBe(0);
    expect(m.completedJobs).toBe(0);
    expect(m.throughput).toBe(0);
    expect(m.maxWaitTicks).toBe(0);
  });

  it('throughput = pekerjaan selesai / tick', () => {
    const engine = makeEngine({ kind: 'random', cores: 1 });
    runToEnd(engine);
    const m = computeMetrics(engine.getSnapshot());
    // 2 robot x 5 pengulangan = 10 pekerjaan, 40 tick (4 instruksi per pengulangan)
    expect(m.completedJobs).toBe(10);
    expect(m.tick).toBe(40);
    expect(m.throughput).toBeCloseTo(0.25, 10);
  });

  it('cores = 2 menggandakan throughput', () => {
    const engine = makeEngine({ kind: 'random', cores: 2 });
    runToEnd(engine);
    const m = computeMetrics(engine.getSnapshot());
    expect(m.completedJobs).toBe(10);
    expect(m.tick).toBe(20);
    expect(m.throughput).toBeCloseTo(0.5, 10);
  });

  it('pekerjaan yang belum selesai satu putaran tidak dihitung', () => {
    const engine = makeEngine({
      kind: 'scripted',
      cores: 1,
      script: ['A', 'A', 'A'],
    });
    engine.step();
    engine.step();
    engine.step();
    expect(computeMetrics(engine.getSnapshot()).completedJobs).toBe(0);
    engine.step(); // WRITE selesai -> satu putaran A selesai
    expect(computeMetrics(engine.getSnapshot()).completedJobs).toBe(1);
  });
});

describe('computeMetrics: waktu tunggu', () => {
  it('menghitung per thread, rata-rata, dan maksimum dari snapshot', () => {
    const engine = makeEngine({ kind: 'random', cores: 1 });
    // Belum ada primitif yang membuat thread WAITING (T-018), jadi nilainya
    // disuntikkan lewat salinan snapshot.
    const snap: Snapshot = {
      ...engine.getSnapshot(),
      cores: 1,
      executedInstructions: 0,
      threads: engine.getSnapshot().threads.map((t, i) => ({
        ...t,
        waitTicks: i === 0 ? 4 : 10,
      })),
    };
    const m = computeMetrics(snap);
    expect(m.waitTicksByThread).toEqual({ A: 4, B: 10 });
    expect(m.avgWaitTicks).toBe(7);
    expect(m.maxWaitTicks).toBe(10);
  });

  it('tanpa mutex tidak ada waktu tunggu', () => {
    const engine = makeEngine({ kind: 'random', cores: 1 }, 3);
    runToEnd(engine);
    const m = computeMetrics(engine.getSnapshot());
    expect(m.avgWaitTicks).toBe(0);
    expect(m.maxWaitTicks).toBe(0);
  });
});

describe('computeMetrics: lostUpdates', () => {
  const expected = { variable: 'stok', value: 2 };

  it('jadwal selang-seling: satu pembaruan hilang', () => {
    // Dua robot, satu putaran: A READ, B READ, ... keduanya menulis 1 -> stok 1, bukan 2
    const engine = makeEngine(
      {
        kind: 'scripted',
        cores: 1,
        script: ['A', 'A', 'B', 'B', 'A', 'B', 'A', 'B'],
      },
      1,
      1,
    );
    runToEnd(engine);
    expect(engine.getSnapshot().sharedVars.stok).toBe(1);
    expect(computeMetrics(engine.getSnapshot(), expected).lostUpdates).toBe(1);
  });

  it('jadwal berurutan: tidak ada pembaruan hilang', () => {
    const engine = makeEngine(
      {
        kind: 'scripted',
        cores: 1,
        script: ['A', 'A', 'A', 'A', 'B', 'B', 'B', 'B'],
      },
      1,
      1,
    );
    runToEnd(engine);
    expect(computeMetrics(engine.getSnapshot(), expected).lostUpdates).toBe(0);
  });

  it('null bila expected tidak diberikan', () => {
    const engine = makeEngine({ kind: 'random', cores: 1 });
    runToEnd(engine);
    expect(computeMetrics(engine.getSnapshot()).lostUpdates).toBeNull();
  });

  it('null selama simulasi belum selesai (nilai belum final)', () => {
    const engine = makeEngine({ kind: 'random', cores: 1 }, 5);
    for (let i = 0; i < 10; i++) engine.step();
    expect(
      computeMetrics(engine.getSnapshot(), { variable: 'stok', value: 10 })
        .lostUpdates,
    ).toBeNull();
  });

  it('null bila simulasi dihentikan maxTicks sebelum semua thread selesai', () => {
    const engine = makeEngine({ kind: 'random', cores: 1 }, 5, 5, 10);
    runToEnd(engine);
    expect(engine.getSnapshot().finished).toBe(true);
    expect(
      computeMetrics(engine.getSnapshot(), { variable: 'stok', value: 10 })
        .lostUpdates,
    ).toBeNull();
  });

  it('tidak pernah negatif', () => {
    const engine = makeEngine({ kind: 'random', cores: 1 }, 5);
    runToEnd(engine);
    const m = computeMetrics(engine.getSnapshot(), {
      variable: 'stok',
      value: 0,
    });
    expect(m.lostUpdates).toBe(0);
  });

  it('variabel yang tidak ada melempar error jelas', () => {
    const engine = makeEngine({ kind: 'random', cores: 1 });
    expect(() =>
      computeMetrics(engine.getSnapshot(), { variable: 'hantu', value: 1 }),
    ).toThrow(/"hantu"/);
  });
});

describe('computeMetrics: kemurnian fungsi', () => {
  it('tidak mengubah snapshot masukan', () => {
    const engine = makeEngine({ kind: 'random', cores: 1 });
    runToEnd(engine);
    const snap = engine.getSnapshot();
    const before = JSON.stringify(snap);
    computeMetrics(snap, { variable: 'stok', value: 10 });
    expect(JSON.stringify(snap)).toBe(before);
  });
});
