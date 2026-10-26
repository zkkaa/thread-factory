import { describe, it, expect } from 'vitest';
import { Engine } from '../../../engine/engine';
import { computeMetrics } from '../../../engine/metrics';
import { applyTools, type PlacedTool } from '../../../engine/tools';
import type { EngineConfig, SchedulerConfig } from '../../../engine/types';
import { level1_1 } from '../../module1/level-1-1';

const EXPECTED = level1_1.goal.target;

/**
 * Jadwal paksa: A dan B sama-sama READ sebelum salah satunya WRITE, dua kali
 * berturut-turut. Setelah script habis, scheduler mengisi sisa jatah menurut
 * urutan definisi thread (A sampai selesai, lalu B), tanpa lost update lagi.
 * Hasil tanpa mutex: stok akhir 8 (2 pembaruan hilang), tanpa bergantung PRNG.
 */
const FORCED_RACE: SchedulerConfig = {
  kind: 'scripted',
  cores: 1,
  script: [
    'A',
    'A',
    'B',
    'B',
    'A',
    'A',
    'B',
    'B', // putaran 1: A WORK+READ, B WORK+READ, A COMPUTE+WRITE, B COMPUTE+WRITE
    'A',
    'A',
    'B',
    'B',
    'A',
    'A',
    'B',
    'B', // putaran 2: sama
  ],
};

/** Mutex 'papan' menutupi READ sampai WRITE (indeks 1..3) di kedua robot. */
const PAPAN_MUTEX: PlacedTool = {
  id: 'papan-1',
  kind: 'mutex',
  mutex: 'papan',
  spans: [
    { thread: 'A', start: 1, end: 3 },
    { thread: 'B', start: 1, end: 3 },
  ],
};

/** Meniru terjemahan LevelDefinition -> EngineConfig yang nanti dilakukan controller. */
function buildConfig(options: {
  tools?: PlacedTool[];
  scheduler?: SchedulerConfig;
}): EngineConfig {
  return {
    threads: applyTools(level1_1.threads, options.tools ?? []),
    sharedVars: { ...level1_1.sharedVars },
    mutexes: level1_1.resources
      .filter((r) => r.kind === 'mutex')
      .map((r) => r.id),
    semaphores: {},
    conditions: [],
    scheduler: options.scheduler ?? level1_1.scheduler,
    maxTicks: level1_1.maxTicks ?? 2000,
  };
}

function run(config: EngineConfig, seed: number): Engine {
  const engine = new Engine();
  engine.load(config, seed);
  while (!engine.isFinished) engine.step();
  return engine;
}

function lostUpdatesOf(engine: Engine): number {
  return computeMetrics(engine.getSnapshot(), EXPECTED).lostUpdates as number;
}

describe('Level 1-1: seed tutorial dan jadwal paksa (T-023)', () => {
  it('tutorialSeed terisi di data level', () => {
    expect(level1_1.tutorialSeed).toBe(10);
  });

  it('tanpa mutex, tutorialSeed memunculkan lost update: stok 8, bukan 10', () => {
    const engine = run(buildConfig({}), level1_1.tutorialSeed as number);
    const snap = engine.getSnapshot();
    expect(snap.sharedVars.stok).toBe(8);
    expect(computeMetrics(snap, EXPECTED).lostUpdates).toBe(2);
    expect(level1_1.goal.invariant(snap).ok).toBe(false);
  });

  it('tanpa mutex, jadwal paksa memunculkan lost update tanpa bergantung PRNG', () => {
    // Seed sengaja dibuat berbeda-beda: hasilnya harus sama karena script tetap.
    for (const seed of [1, 10, 999]) {
      const engine = run(buildConfig({ scheduler: FORCED_RACE }), seed);
      expect(engine.getSnapshot().sharedVars.stok).toBe(8);
      expect(lostUpdatesOf(engine)).toBe(2);
    }
  });

  it('dengan mutex, tutorialSeed menghasilkan stok 10 dan invariant lulus', () => {
    const engine = run(
      buildConfig({ tools: [PAPAN_MUTEX] }),
      level1_1.tutorialSeed as number,
    );
    const snap = engine.getSnapshot();
    expect(snap.sharedVars.stok).toBe(10);
    expect(lostUpdatesOf(engine)).toBe(0);
    expect(level1_1.goal.invariant(snap).ok).toBe(true);
  });

  it('dengan mutex, jadwal paksa yang sama tidak lagi merusak data', () => {
    const engine = run(
      buildConfig({ tools: [PAPAN_MUTEX], scheduler: FORCED_RACE }),
      1,
    );
    expect(engine.getSnapshot().sharedVars.stok).toBe(10);
    expect(lostUpdatesOf(engine)).toBe(0);
  });

  it('dengan mutex, hasil tetap benar pada 1.000 seed acak', () => {
    const config = buildConfig({ tools: [PAPAN_MUTEX] });
    for (let seed = 1; seed <= 1000; seed++) {
      const engine = run(config, seed);
      expect(engine.getSnapshot().sharedVars.stok).toBe(10);
    }
  });
});
