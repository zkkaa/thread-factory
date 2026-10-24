import { describe, it, expect } from 'vitest';
import { Engine } from '../../engine/engine';
import type { PlacedTool } from '../../engine/tools';
import type { Snapshot } from '../../engine/types';
import { level1_1 } from '../../levels/module1/level-1-1';
import type { LevelDefinition } from '../../levels/types';
import { buildEngineConfig } from '../buildEngineConfig';
import { evaluateLevel } from '../evaluateLevel';

/** Mutex yang menutupi rentang `start..end` pada kedua robot. */
function mutexOnBoth(start: number, end: number): PlacedTool {
  return {
    id: 'm1',
    kind: 'mutex',
    mutex: 'papan',
    spans: [
      { thread: 'A', start, end },
      { thread: 'B', start, end },
    ],
  };
}

function finalSnapshot(level: LevelDefinition, tools: PlacedTool[], seed: number): Snapshot {
  const engine = new Engine();
  engine.load(buildEngineConfig(level, tools), seed);
  while (!engine.isFinished) engine.step();
  return engine.getSnapshot() as Snapshot;
}

const SEED = level1_1.tutorialSeed as number;

describe('evaluateLevel: lulus atau gagal', () => {
  it('tanpa mutex pada seed tutorial: gagal, stok 8, dua pembaruan hilang, 0 bintang', () => {
    const result = evaluateLevel(level1_1, finalSnapshot(level1_1, [], SEED));
    expect(result.ok).toBe(false);
    expect(result.message).toContain('8');
    expect(result.metrics.lostUpdates).toBe(2);
    expect(result.stars).toBe(0);
  });

  it('mutex pas (READ..WRITE) pada seed tutorial: lulus dengan 3 bintang', () => {
    const result = evaluateLevel(level1_1, finalSnapshot(level1_1, [mutexOnBoth(1, 3)], SEED));
    expect(result.ok).toBe(true);
    expect(result.metrics.lostUpdates).toBe(0);
    expect(result.stars).toBe(3);
  });

  it('mutex terlalu besar (ikut menutupi WORK): lulus, tapi waktu tunggu terlalu besar -> 2 bintang', () => {
    const snapshot = finalSnapshot(level1_1, [mutexOnBoth(0, 3)], SEED);
    const result = evaluateLevel(level1_1, snapshot);
    expect(result.ok).toBe(true);
    expect(result.stars).toBe(2);
    expect(result.metrics.avgWaitTicks * 2).toBeGreaterThan(level1_1.goal.stars.lowWait);
  });

  it('simulasi yang dipotong maxTicks: gagal walau belum ada yang rusak, dengan pesan jelas', () => {
    const cut: LevelDefinition = { ...level1_1, maxTicks: 10 };
    const result = evaluateLevel(cut, finalSnapshot(cut, [mutexOnBoth(1, 3)], SEED));
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/berhenti sebelum semua robot selesai/);
    expect(result.stars).toBe(0);
    expect(result.metrics.lostUpdates).toBeNull();
  });
});

describe('evaluateLevel: bintang bertingkat dari ambang level', () => {
  const tools = [mutexOnBoth(1, 3)];
  const withStars = (fast: number, lowWait: number): LevelDefinition => ({
    ...level1_1,
    goal: { ...level1_1.goal, stars: { fast, lowWait } },
  });

  it('tick melewati ambang fast: berhenti di 1 bintang', () => {
    const level = withStars(59, 1000);
    expect(evaluateLevel(level, finalSnapshot(level, tools, SEED)).stars).toBe(1);
  });

  it('tick tepat sama dengan ambang fast masih dihitung (batas maksimum)', () => {
    const level = withStars(60, 1000);
    expect(evaluateLevel(level, finalSnapshot(level, tools, SEED)).stars).toBe(3);
  });

  it('waktu tunggu melewati ambang lowWait: 2 bintang', () => {
    const level = withStars(60, 22);
    expect(evaluateLevel(level, finalSnapshot(level, tools, SEED)).stars).toBe(2);
  });

  it('bintang bertingkat: lowWait terpenuhi tapi fast tidak -> tetap 1 bintang', () => {
    const level = withStars(10, 1000);
    expect(evaluateLevel(level, finalSnapshot(level, tools, SEED)).stars).toBe(1);
  });
});

describe('evaluateLevel: bintang hanya pada seed tutorial', () => {
  it('seed lain: tetap dinilai lulus/gagal, tetapi bintang null', () => {
    const pass = evaluateLevel(level1_1, finalSnapshot(level1_1, [mutexOnBoth(1, 3)], 11));
    expect(pass.ok).toBe(true);
    expect(pass.stars).toBeNull();

    const fail = evaluateLevel(level1_1, finalSnapshot(level1_1, [], 11));
    expect(fail.ok).toBe(false);
    expect(fail.stars).toBeNull();
  });

  it('level tanpa tutorialSeed: bintang dinilai pada seed mana pun', () => {
    const level: LevelDefinition = { ...level1_1, tutorialSeed: undefined };
    const result = evaluateLevel(level, finalSnapshot(level, [mutexOnBoth(1, 3)], 11));
    expect(result.stars).not.toBeNull();
  });
});

describe('evaluateLevel: kemurnian', () => {
  it('tidak mengubah snapshot masukan', () => {
    const snapshot = finalSnapshot(level1_1, [], SEED);
    const before = JSON.stringify(snapshot);
    evaluateLevel(level1_1, snapshot);
    expect(JSON.stringify(snapshot)).toBe(before);
  });
});