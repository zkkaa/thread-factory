import { describe, expect, it } from 'vitest';
import { buildEngineConfig } from '../../../controller/buildEngineConfig';
import { evaluateLevel } from '../../../controller/evaluateLevel';
import { Engine } from '../../../engine/engine';
import type { PlacedTool } from '../../../engine/tools';
import { level1_3 } from '../level-1-3';

const SEED = level1_3.tutorialSeed as number;

/** Gerbang Kartu Akses yang menutupi ENTER_AREA sampai LEAVE_AREA (indeks 1..3). */
function cardGate(value: number): PlacedTool {
  return {
    id: 'sem-kartu',
    kind: 'semaphore',
    sem: 'kartu',
    value,
    spans: level1_3.threads.map((t) => ({ thread: t.id, start: 1, end: 3 })),
  };
}

function play(tools: PlacedTool[], seed: number) {
  const engine = new Engine();
  engine.load(buildEngineConfig(level1_3, tools), seed);
  while (!engine.isFinished) engine.step();
  const snapshot = engine.getSnapshot();
  const result = evaluateLevel(level1_3, snapshot);
  const totalWait = Object.values(result.metrics.waitTicksByThread).reduce(
    (a, b) => a + b,
    0,
  );
  return { snapshot, result, totalWait };
}

describe('Level 1-3: bintang bertingkat pada seed tutorial (T-043)', () => {
  it('tanpa gerbang: bentrok, gagal, 0 bintang', () => {
    const { result } = play([], SEED);
    expect(result.ok).toBe(false);
    expect(result.stars).toBe(0);
  });

  it('kapasitas 4 sampai 8: bentrok, gagal, 0 bintang', () => {
    for (const value of [4, 5, 6, 8]) {
      const { snapshot, result } = play([cardGate(value)], SEED);
      expect(snapshot.overloadTicks, `kapasitas ${value}`).toBeGreaterThan(0);
      expect(result.ok, `kapasitas ${value}`).toBe(false);
      expect(result.stars, `kapasitas ${value}`).toBe(0);
    }
  });

  it('kapasitas 1: aman tetapi lambat, 1 bintang', () => {
    const { snapshot, result } = play([cardGate(1)], SEED);
    expect(result.ok).toBe(true);
    expect(snapshot.tick).toBeGreaterThan(level1_3.goal.stars.fast);
    expect(result.stars).toBe(1);
  });

  it('kapasitas 2: aman dan cukup cepat tetapi banyak menunggu, 2 bintang', () => {
    const { snapshot, result, totalWait } = play([cardGate(2)], SEED);
    expect(result.ok).toBe(true);
    expect(snapshot.tick).toBeLessThanOrEqual(level1_3.goal.stars.fast);
    expect(totalWait).toBeGreaterThan(level1_3.goal.stars.lowWait);
    expect(result.stars).toBe(2);
  });

  it('kapasitas 3: optimal, 3 bintang', () => {
    const { snapshot, result, totalWait } = play([cardGate(3)], SEED);
    expect(result.ok).toBe(true);
    expect(snapshot.tick).toBeLessThanOrEqual(level1_3.goal.stars.fast);
    expect(totalWait).toBeLessThanOrEqual(level1_3.goal.stars.lowWait);
    expect(result.stars).toBe(3);
  });

  it('seed lain: lulus atau gagal tetap dinilai, tetapi bintang null', () => {
    const pass = play([cardGate(3)], 11).result;
    expect(pass.ok).toBe(true);
    expect(pass.stars).toBeNull();

    const fail = play([], 11).result;
    expect(fail.ok).toBe(false);
    expect(fail.stars).toBeNull();
  });
});
