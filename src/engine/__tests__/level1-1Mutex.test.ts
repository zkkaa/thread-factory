import { describe, it, expect } from 'vitest';
import { Engine } from '../engine';
import { computeMetrics } from '../metrics';
import { applyTools, type PlacedTool } from '../tools';
import type { EngineConfig, SimEvent, ThreadDef } from '../types';

const TARGET = 10;
const EXPECTED = { variable: 'stok', value: TARGET };

/** Robot Level 1-1: WORK -> READ -> COMPUTE -> WRITE, diulang 5x. */
function robot(id: string): ThreadDef {
  return {
    id,
    label: `Robot ${id}`,
    repeat: 5,
    program: [
      { op: 'WORK', ticks: 1 },
      { op: 'READ', from: 'stok', into: 'r' },
      { op: 'COMPUTE', reg: 'r', add: 1 },
      { op: 'WRITE', reg: 'r', to: 'stok' },
    ],
  };
}

/** Pintu kunci yang menutupi baca-hitung-tulis (indeks 1..3) di kedua robot. */
const door: PlacedTool = {
  id: 'pintu-stok',
  kind: 'mutex',
  mutex: 'pintu',
  spans: [
    { thread: 'A', start: 1, end: 3 },
    { thread: 'B', start: 1, end: 3 },
  ],
};

function makeConfig(withMutex: boolean): EngineConfig {
  const base = [robot('A'), robot('B')];
  return {
    threads: withMutex ? applyTools(base, [door]) : base,
    sharedVars: { stok: 0 },
    mutexes: withMutex ? ['pintu'] : [],
    semaphores: {},
    conditions: [],
    scheduler: { kind: 'random', cores: 1 },
    maxTicks: 1000,
  };
}

const withMutex = makeConfig(true);
const withoutMutex = makeConfig(false);

function simulate(
  config: EngineConfig,
  seed: number,
): { events: SimEvent[]; engine: Engine } {
  const engine = new Engine();
  engine.load(config, seed);
  const events: SimEvent[] = [];
  while (!engine.isFinished) events.push(...engine.step().events);
  return { events, engine };
}

describe('Level 1-1 dengan mutex (T-021)', () => {
  it('nilai akhir = target, tanpa pembaruan hilang, pada 1.000 seed', () => {
    for (let seed = 1; seed <= 1000; seed++) {
      const { engine } = simulate(withMutex, seed);
      const snap = engine.getSnapshot();

      // Semua robot harus benar-benar selesai: bukan deadlock dan bukan mentok di maxTicks.
      const allTerminated = snap.threads.every((t) => t.state === 'TERMINATED');
      expect(
        allTerminated,
        `seed ${seed}: ada robot yang belum TERMINATED`,
      ).toBe(true);
      expect(
        snap.tick,
        `seed ${seed}: simulasi mentok di maxTicks`,
      ).toBeLessThan(withMutex.maxTicks);

      expect(snap.sharedVars.stok, `seed ${seed}: stok akhir salah`).toBe(
        TARGET,
      );
      expect(
        computeMetrics(snap, EXPECTED).lostUpdates,
        `seed ${seed}: ada pembaruan hilang`,
      ).toBe(0);
    }
  });

  it('mutex dilepas semua dan antreannya kosong saat simulasi selesai', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const { engine } = simulate(withMutex, seed);
      const mutexes = engine.getSnapshot().mutexes;
      expect(mutexes).toEqual([{ id: 'pintu', owner: null, queue: [] }]);
    }
  });

  it('seed yang sama menghasilkan event dan keadaan akhir identik', () => {
    const first = simulate(withMutex, 10);
    const second = simulate(withMutex, 10);
    expect(second.events).toEqual(first.events);
    expect(second.engine.getSnapshot()).toEqual(first.engine.getSnapshot());
  });

  it('pembanding: seed 10 salah tanpa mutex, benar dengan mutex', () => {
    // Seed 10 menghasilkan stok 8 tanpa mutex (lihat lostUpdate.test.ts, T-017).
    const without = simulate(withoutMutex, 10).engine.getSnapshot();
    expect(without.sharedVars.stok).not.toBe(TARGET);

    const withLock = simulate(withMutex, 10).engine.getSnapshot();
    expect(withLock.sharedVars.stok).toBe(TARGET);
  });

  it('mutex punya harga: ada robot yang menunggu pada sebagian seed', () => {
    let seedsWithWaiting = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const metrics = computeMetrics(
        simulate(withMutex, seed).engine.getSnapshot(),
        EXPECTED,
      );
      if (metrics.maxWaitTicks > 0) seedsWithWaiting += 1;
    }
    expect(seedsWithWaiting).toBeGreaterThan(0);
  });
});
