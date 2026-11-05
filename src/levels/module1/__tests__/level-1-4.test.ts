import { describe, expect, it } from 'vitest';
import { buildEngineConfig } from '../../../controller/buildEngineConfig';
import { evaluateLevel } from '../../../controller/evaluateLevel';
import { Engine } from '../../../engine/engine';
import type { EngineConfig, ThreadDef } from '../../../engine/types';
import { level1_4 } from '../level-1-4';

/** Versi dengan Lampu Sinyal, ditulis tangan (nanti dihasilkan alat T-091). */
const CONDITION_THREADS: ThreadDef[] = [
  {
    id: 'A',
    label: 'Perakit',
    program: [
      { op: 'WORK', ticks: 18 },
      { op: 'LOCK', mutex: 'meja' },
      { op: 'READ', from: 'barang', into: 'r' },
      { op: 'COMPUTE', reg: 'r', add: 3 },
      { op: 'WRITE', reg: 'r', to: 'barang' },
      { op: 'COND_SIGNAL', cond: 'lampu' },
      { op: 'UNLOCK', mutex: 'meja' },
    ],
    repeat: 1,
  },
  {
    id: 'P',
    label: 'Pengepak',
    program: [
      { op: 'LOCK', mutex: 'meja' },
      { op: 'COND_WAIT', cond: 'lampu', mutex: 'meja' },
      { op: 'UNLOCK', mutex: 'meja' },
      { op: 'WORK', ticks: 3 },
    ],
    repeat: 1,
  },
];

function run(withCondition: boolean, seed = 10) {
  const base = buildEngineConfig(level1_4, []);
  const config: EngineConfig = withCondition
    ? { ...base, threads: CONDITION_THREADS }
    : base;
  const engine = new Engine();
  engine.load(config, seed);
  while (!engine.isFinished) engine.step();
  return engine.getSnapshot();
}

describe('Level 1-4: Lampu Sinyal (T-046)', () => {
  it('data level: 2 robot, 2 core, mutex dan condition, alat condition', () => {
    expect(level1_4.threads.map((t) => t.id)).toEqual(['A', 'P']);
    expect(level1_4.scheduler.cores).toBe(2);
    expect(level1_4.availableTools).toEqual(['condition']);
    expect(level1_4.resources.map((r) => r.kind)).toEqual([
      'mutex',
      'condition',
    ]);
    expect(level1_4.intro.length).toBeGreaterThanOrEqual(2);
    expect(level1_4.intro.length).toBeLessThanOrEqual(3);
    expect(level1_4.hints.length).toBeGreaterThanOrEqual(3);
  });

  it('tanpa alat: pengepak busy waiting, tidak pernah WAITING, level gagal', () => {
    const snap = run(false);
    const packer = snap.threads.find((t) => t.id === 'P');
    expect(snap.threads.every((t) => t.state === 'TERMINATED')).toBe(true);
    expect(snap.sharedVars['barang']).toBe(3);
    expect(packer?.waitTicks).toBe(0);
    expect(packer?.busyWaitTicks).toBeGreaterThanOrEqual(20);
    expect(snap.busyWaitTicks).toBe(packer?.busyWaitTicks);

    const result = evaluateLevel(level1_4, snap);
    expect(result.ok).toBe(false);
    expect(result.stars).toBe(0);
    expect(result.message).toContain('busy waiting');
  });

  it('dengan Lampu Sinyal: pengepak tidur, tanpa busy waiting, 3 bintang', () => {
    const snap = run(true);
    const packer = snap.threads.find((t) => t.id === 'P');
    expect(snap.threads.every((t) => t.state === 'TERMINATED')).toBe(true);
    expect(snap.sharedVars['barang']).toBe(3);
    expect(packer?.busyWaitTicks).toBe(0);
    expect(packer?.waitTicks).toBeGreaterThan(0);
    expect(snap.busyWaitTicks).toBe(0);

    const result = evaluateLevel(level1_4, snap);
    expect(result.ok).toBe(true);
    expect(result.stars).toBe(3);
  });

  it('Lampu Sinyal menghemat energi tanpa memperlambat jauh', () => {
    const spin = run(false);
    const sleep = run(true);
    expect(sleep.busyWaitTicks).toBeLessThan(spin.busyWaitTicks);
    expect(sleep.tick).toBeLessThanOrEqual(spin.tick + 5);
  });

  it('hasil sama pada banyak seed: tanpa alat selalu gagal, dengan sinyal selalu lulus', () => {
    for (let seed = 1; seed <= 50; seed++) {
      expect(evaluateLevel(level1_4, run(false, seed)).ok, `spin ${seed}`).toBe(
        false,
      );
      expect(
        evaluateLevel(level1_4, run(true, seed)).ok,
        `sinyal ${seed}`,
      ).toBe(true);
    }
  });
});
