import { describe, it, expect } from 'vitest';
import { level1_1, LEVEL_1_1_PROGRAM } from '../level-1-1';
import { Engine } from '../../../engine/engine';
import { applyTools, type PlacedTool } from '../../../engine/tools';
import { findLevelById, ALL_LEVELS } from '../../index';
import type { EngineConfig } from '../../../engine/types';

describe('Level 1-1 Definition (T-022)', () => {
  it('memiliki metadata level yang sesuai spesifikasi', () => {
    expect(level1_1.id).toBe('1-1');
    expect(level1_1.module).toBe(1);
    expect(level1_1.title).toBe('Bug Papan Stok');
    expect(level1_1.availableTools).toEqual(['mutex']);
    expect(level1_1.sharedVars).toEqual({ stok: 0 });
    expect(level1_1.resources).toEqual([
      { kind: 'mutex', id: 'papan', label: 'Pintu Papan Stok' },
    ]);
  });

  it('memiliki dua robot dengan 5 repeat dan target stok 10', () => {
    expect(level1_1.threads).toHaveLength(2);
    expect(level1_1.threads.map((t) => t.id)).toEqual(['A', 'B']);
    expect(level1_1.threads.every((t) => t.repeat === 5)).toBe(true);
    expect(level1_1.goal.target).toEqual({ variable: 'stok', value: 10 });
  });

  it('program robot memiliki 4 instruksi: WORK -> READ -> COMPUTE -> WRITE', () => {
    expect(LEVEL_1_1_PROGRAM).toEqual([
      { op: 'WORK', ticks: 1 },
      { op: 'READ', from: 'stok', into: 'r' },
      { op: 'COMPUTE', reg: 'r', add: 1 },
      { op: 'WRITE', reg: 'r', to: 'stok' },
    ]);
  });

  it('invariant goal mengevaluasi keberhasilan atau kegagalan dengan pesan jelas', () => {
    const successSnap = {
      sharedVars: { stok: 10 },
    } as unknown as import('../../../engine/types').Snapshot;
    const failSnap = {
      sharedVars: { stok: 7 },
    } as unknown as import('../../../engine/types').Snapshot;

    const resSuccess = level1_1.goal.invariant(successSnap);
    expect(resSuccess.ok).toBe(true);
    expect(resSuccess.message).toContain('10');

    const resFail = level1_1.goal.invariant(failSnap);
    expect(resFail.ok).toBe(false);
    expect(resFail.message).toMatch(/7.*10/);
  });

  it('dapat dijalankan di Engine tanpa mutex dan dengan mutex', () => {
    // 1. Tanpa mutex
    const rawConfig: EngineConfig = {
      threads: level1_1.threads,
      sharedVars: { ...level1_1.sharedVars },
      mutexes: level1_1.resources.filter((r) => r.kind === 'mutex').map((r) => r.id),
      semaphores: {},
      conditions: [],
      scheduler: level1_1.scheduler,
      maxTicks: level1_1.maxTicks ?? 2000,
    };

    const engineWithoutMutex = new Engine();
    engineWithoutMutex.load(rawConfig, 10);
    while (!engineWithoutMutex.isFinished) {
      engineWithoutMutex.step();
    }
    const snapWithout = engineWithoutMutex.getSnapshot();
    // Pada seed 10 tanpa mutex, terjadi lost update
    expect(level1_1.goal.invariant(snapWithout).ok).toBe(false);

    // 2. Dengan mutex dipasang di READ (idx 1) sampai WRITE (idx 3)
    const tool: PlacedTool = {
      id: 'papan-lock',
      kind: 'mutex',
      mutex: 'papan',
      spans: [
        { thread: 'A', start: 1, end: 3 },
        { thread: 'B', start: 1, end: 3 },
      ],
    };

    const protectedThreads = applyTools(level1_1.threads, [tool]);
    const protectedConfig: EngineConfig = {
      ...rawConfig,
      threads: protectedThreads,
    };

    const engineWithMutex = new Engine();
    engineWithMutex.load(protectedConfig, 10);
    while (!engineWithMutex.isFinished) {
      engineWithMutex.step();
    }
    const snapWith = engineWithMutex.getSnapshot();
    expect(level1_1.goal.invariant(snapWith).ok).toBe(true);
    expect(snapWith.sharedVars.stok).toBe(10);
  });

  it('terdaftar di findLevelById dan ALL_LEVELS', () => {
    expect(ALL_LEVELS).toContain(level1_1);
    expect(findLevelById('1-1')).toBe(level1_1);
    expect(findLevelById('99-99')).toBeUndefined();
  });
});
