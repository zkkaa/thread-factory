import { describe, expect, it } from 'vitest';
import { buildEngineConfig } from '../../../controller/buildEngineConfig';
import { evaluateLevel } from '../../../controller/evaluateLevel';
import { Engine } from '../../../engine/engine';
import type { PlacedConditionTool, PlacedTool } from '../../../engine/tools';
import { level1_4 } from '../level-1-4';

const LAMPU: PlacedConditionTool = {
  id: 'condition:lampu',
  kind: 'condition',
  cond: 'lampu',
  mutex: 'meja',
  waiter: { thread: 'P', index: 0 },
  signaler: { thread: 'A', slot: 4 },
  spans: [],
};

function run(tools: PlacedTool[], seed = level1_4.tutorialSeed ?? 1) {
  const engine = new Engine();
  engine.load(buildEngineConfig(level1_4, tools), seed);
  while (!engine.isFinished) engine.step();
  return engine.getSnapshot();
}

describe('Level 1-4: Lampu Sinyal (T-091)', () => {
  it('tanpa alat: pengepak busy waiting dan level gagal pada seed tutorial', () => {
    const snap = run([]);
    const result = evaluateLevel(level1_4, snap);
    expect(snap.sharedVars['barang']).toBe(3);
    expect(snap.busyWaitTicks).toBeGreaterThanOrEqual(20);
    expect(snap.busyWaitTicks).toBeLessThanOrEqual(21);
    expect(result.ok).toBe(false);
    expect(result.stars).toBe(0);
  });

  it('dengan Lampu Sinyal: hemat baterai, 3 bintang pada seed tutorial', () => {
    const snap = run([LAMPU]);
    const result = evaluateLevel(level1_4, snap);
    const totalWait = Object.values(result.metrics.waitTicksByThread).reduce(
      (a, b) => a + b,
      0,
    );
    expect(snap.threads.every((t) => t.state === 'TERMINATED')).toBe(true);
    expect(snap.busyWaitTicks).toBe(0);
    expect(snap.tick).toBeLessThanOrEqual(level1_4.goal.stars.fast);
    expect(totalWait).toBe(22);
    expect(result.ok).toBe(true);
    expect(result.stars).toBe(3);
  });

  it('dengan Lampu Sinyal: benar dan tanpa busy waiting pada banyak seed', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const snap = run([LAMPU], seed);
      expect(snap.sharedVars['barang']).toBe(3);
      expect(snap.busyWaitTicks).toBe(0);
      expect(snap.threads.every((t) => t.state === 'TERMINATED')).toBe(true);
    }
  });

  it('pengepak berstatus WAITING di condition saat tidur', () => {
    const engine = new Engine();
    engine.load(buildEngineConfig(level1_4, [LAMPU]), 10);
    for (let i = 0; i < 5; i++) engine.step();
    const packer = engine.getSnapshot().threads.find((t) => t.id === 'P');
    expect(packer?.state).toBe('WAITING');
    expect(packer?.waitingOn).toBe('cond:lampu');
  });
});
