import { describe, it, expect } from 'vitest';
import { Engine } from '../engine';
import { computeMetrics } from '../metrics';
import type { EngineConfig, SimEvent, ThreadDef } from '../types';

const TARGET = 10;
const EXPECTED = { variable: 'stok', value: TARGET };

/** Meniru Level 1-1 TANPA mutex: dua robot, masing-masing 5 produk. */
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

const config: EngineConfig = {
  threads: [robot('A'), robot('B')],
  sharedVars: { stok: 0 },
  mutexes: [],
  semaphores: {},
  conditions: [],
  scheduler: { kind: 'random', cores: 1 },
  maxTicks: 1000,
};

function simulate(seed: number): { events: SimEvent[]; engine: Engine } {
  const engine = new Engine();
  engine.load(config, seed);
  const events: SimEvent[] = [];
  while (!engine.isFinished) events.push(...engine.step().events);
  return { events, engine };
}

function lostUpdates(seed: number): number {
  const { engine } = simulate(seed);
  return computeMetrics(engine.getSnapshot(), EXPECTED).lostUpdates as number;
}

describe('dua thread tanpa pengaman (T-017)', () => {
  it('seed 10 menghasilkan lost update: stok akhir 8, bukan 10', () => {
    // Nilai ini ditemukan dengan mencoba seed 1..1000 pada implementasi scheduler
    // saat ini. Bila tes ini gagal setelah scheduler/PRNG diubah, cari seed baru
    // (itu juga bahan untuk tutorialSeed di T-023); jangan ubah angkanya asal-asalan.
    const { engine } = simulate(10);
    const snap = engine.getSnapshot();
    expect(snap.sharedVars.stok).toBe(8);
    expect(computeMetrics(snap, EXPECTED).lostUpdates).toBe(2);
  });

  it('seed yang sama menghasilkan event dan keadaan akhir identik', () => {
    const first = simulate(10);
    const second = simulate(10);
    expect(second.events).toEqual(first.events);
    expect(second.engine.getSnapshot()).toEqual(first.engine.getSnapshot());
  });

  it('lostUpdates selalu sama dengan target dikurangi stok akhir, pada 1.000 seed', () => {
    for (let seed = 1; seed <= 1000; seed++) {
      const { engine } = simulate(seed);
      const stok = engine.getSnapshot().sharedVars.stok as number;
      expect(stok).toBeLessThanOrEqual(TARGET); // tidak mungkin melebihi target
      expect(computeMetrics(engine.getSnapshot(), EXPECTED).lostUpdates).toBe(
        TARGET - stok,
      );
    }
  });

  it('pembaruan hilang terjadi pada sebagian besar seed, tetapi tidak semuanya identik', () => {
    const losses = Array.from({ length: 200 }, (_, i) => lostUpdates(i + 1));
    expect(losses.filter((n) => n > 0).length).toBeGreaterThan(100);
    expect(new Set(losses).size).toBeGreaterThan(1);
  });

  it('lost update terlihat di event: ada WRITE yang menimpa nilai lebih baru', () => {
    // Lost update terlihat di event: ada WRITE yang menulis nilai <= nilai lama.
    const { events } = simulate(10);
    const overwrites = events.filter(
      (e) => e.type === 'VAR_WRITTEN' && e.newValue <= e.oldValue,
    );
    expect(overwrites.length).toBeGreaterThan(0);
  });
});
