import { describe, expect, it } from 'vitest';
import { Engine } from '../engine';
import { computeMetrics } from '../metrics';
import type { EngineConfig, ThreadDef } from '../types';

function worker(id: string, ticks: number): ThreadDef {
  return {
    id,
    label: id,
    program: [{ op: 'WORK', ticks: 1 }],
    repeat: ticks,
  };
}

function makeConfig(threads: ThreadDef[], cores: number): EngineConfig {
  return {
    threads,
    sharedVars: {},
    mutexes: [],
    semaphores: {},
    conditions: [],
    scheduler: { kind: 'random', cores },
    maxTicks: 1000,
  };
}

function runToEnd(config: EngineConfig, seed = 1) {
  const engine = new Engine();
  engine.load(config, seed);
  while (!engine.isFinished) engine.step();
  return engine.getSnapshot();
}

describe('coreUtilization', () => {
  it('snapshot membawa jumlah core dari konfigurasi', () => {
    const engine = new Engine();
    engine.load(makeConfig([worker('A', 2)], 2), 1);
    expect(engine.getSnapshot().cores).toBe(2);
    expect(engine.getSnapshot().executedInstructions).toBe(0);
  });

  it('bernilai 0 pada tick 0', () => {
    const engine = new Engine();
    engine.load(makeConfig([worker('A', 2)], 1), 1);
    expect(computeMetrics(engine.getSnapshot()).coreUtilization).toBe(0);
  });

  it('satu thread di satu core: core selalu sibuk (1)', () => {
    const snap = runToEnd(makeConfig([worker('A', 4)], 1));
    expect(snap.executedInstructions).toBe(snap.tick);
    expect(computeMetrics(snap).coreUtilization).toBe(1);
  });

  it('satu thread di dua core: separuh core menganggur (0,5)', () => {
    const snap = runToEnd(makeConfig([worker('A', 4)], 2));
    expect(computeMetrics(snap).coreUtilization).toBe(0.5);
  });

  it('dua thread sama panjang di dua core: kedua core penuh (1)', () => {
    const snap = runToEnd(makeConfig([worker('A', 4), worker('B', 4)], 2));
    expect(snap.executedInstructions).toBe(8);
    expect(computeMetrics(snap).coreUtilization).toBe(1);
  });

  it('reset mengembalikan penghitung ke 0', () => {
    const engine = new Engine();
    engine.load(makeConfig([worker('A', 3)], 1), 1);
    engine.step();
    engine.step();
    expect(engine.getSnapshot().executedInstructions).toBe(2);
    engine.reset();
    expect(engine.getSnapshot().executedInstructions).toBe(0);
  });
});
