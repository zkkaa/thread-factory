import { describe, expect, it } from 'vitest';
import { buildEngineConfig } from '../../../controller/buildEngineConfig';
import { evaluateLevel } from '../../../controller/evaluateLevel';
import { Engine } from '../../../engine/engine';
import type { PlacedTool } from '../../../engine/tools';
import { level2_3 } from '../level-2-3';

const SEED = level2_3.tutorialSeed as number;

function seatTool(value: number): PlacedTool {
  return {
    id: 'semaphore:kursi',
    kind: 'semaphore',
    sem: 'kursi',
    value,
    spans: level2_3.threads.map((t) => ({ thread: t.id, start: 0, end: 4 })),
  };
}

/** Jalankan sampai selesai atau macet (deadlock). */
function play(tools: PlacedTool[], seed: number) {
  const engine = new Engine();
  engine.load(buildEngineConfig(level2_3, tools), seed);
  for (let i = 0; i < 1000; i += 1) {
    if (engine.isFinished || engine.getSnapshot().deadlock) break;
    engine.step();
  }
  const snapshot = engine.getSnapshot();
  const result = evaluateLevel(level2_3, snapshot);
  const totalWait = Object.values(result.metrics.waitTicksByThread).reduce(
    (a, b) => a + b,
    0,
  );
  return { snapshot, result, totalWait };
}

describe('Level 2-3: bintang bertingkat pada seed tutorial (T-102)', () => {
  it('tanpa alat: deadlock, gagal, 0 bintang', () => {
    const { snapshot, result } = play([], SEED);
    expect(Boolean(snapshot.deadlock)).toBe(true);
    expect(result.ok).toBe(false);
    expect(result.stars).toBe(0);
  });

  it('kursi 5 (tanpa batas efektif): deadlock, 0 bintang', () => {
    const { snapshot, result } = play([seatTool(5)], SEED);
    expect(Boolean(snapshot.deadlock)).toBe(true);
    expect(result.stars).toBe(0);
  });

  it('kursi 1: aman tetapi lambat, 1 bintang', () => {
    const { snapshot, result } = play([seatTool(1)], SEED);
    expect(result.ok).toBe(true);
    expect(snapshot.tick).toBeGreaterThan(level2_3.goal.stars.fast);
    expect(result.stars).toBe(1);
  });

  it('kursi 2 dan 4: aman dan cepat tetapi banyak menunggu, 2 bintang', () => {
    for (const value of [2, 4]) {
      const { snapshot, result, totalWait } = play([seatTool(value)], SEED);
      expect(result.ok, `kursi ${value}`).toBe(true);
      expect(snapshot.tick, `kursi ${value}`).toBeLessThanOrEqual(
        level2_3.goal.stars.fast,
      );
      expect(totalWait, `kursi ${value}`).toBeGreaterThan(
        level2_3.goal.stars.lowWait,
      );
      expect(result.stars, `kursi ${value}`).toBe(2);
    }
  });

  it('kursi 3: optimal, 3 bintang', () => {
    const { snapshot, result, totalWait } = play([seatTool(3)], SEED);
    expect(result.ok).toBe(true);
    expect(snapshot.tick).toBeLessThanOrEqual(level2_3.goal.stars.fast);
    expect(totalWait).toBeLessThanOrEqual(level2_3.goal.stars.lowWait);
    expect(result.stars).toBe(3);
  });

  it('seed lain: lulus atau gagal tetap dinilai, tetapi bintang null', () => {
    const pass = play([seatTool(4)], 11).result;
    expect(pass.ok).toBe(true);
    expect(pass.stars).toBeNull();

    const fail = play([], 11).result;
    expect(fail.ok).toBe(false);
    expect(fail.stars).toBeNull();
  });
});
