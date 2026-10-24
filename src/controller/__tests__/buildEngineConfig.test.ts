import { describe, it, expect } from 'vitest';
import type { PlacedTool } from '../../engine/tools';
import { level1_1 } from '../../levels/module1/level-1-1';
import type { LevelDefinition } from '../../levels/types';
import { buildEngineConfig, DEFAULT_MAX_TICKS } from '../buildEngineConfig';

const papan: PlacedTool = {
  id: 'pintu-papan',
  kind: 'mutex',
  mutex: 'papan',
  spans: [
    { thread: 'A', start: 1, end: 3 },
    { thread: 'B', start: 1, end: 3 },
  ],
};

describe('buildEngineConfig', () => {
  it('menerjemahkan Level 1-1 tanpa alat', () => {
    const config = buildEngineConfig(level1_1, []);
    expect(config.mutexes).toEqual(['papan']);
    expect(config.semaphores).toEqual({});
    expect(config.conditions).toEqual([]);
    expect(config.sharedVars).toEqual({ stok: 0 });
    expect(config.scheduler).toEqual(level1_1.scheduler);
    expect(config.maxTicks).toBe(2000);
    expect(config.threads.map((t) => t.program.length)).toEqual([4, 4]);
  });

  it('menyisipkan LOCK/UNLOCK dari alat pemain', () => {
    const config = buildEngineConfig(level1_1, [papan]);
    const ops = config.threads[0].program.map((i) => i.op);
    expect(ops).toEqual(['WORK', 'LOCK', 'READ', 'COMPUTE', 'WRITE', 'UNLOCK']);
  });

  it('tidak mengubah data level dan mengembalikan salinan', () => {
    const before = structuredClone({
      threads: level1_1.threads,
      sharedVars: level1_1.sharedVars,
    });
    const config = buildEngineConfig(level1_1, [papan]);
    config.sharedVars.stok = 99;
    expect(level1_1.threads).toEqual(before.threads);
    expect(level1_1.sharedVars).toEqual(before.sharedVars);
    expect(config.threads[0]).not.toBe(level1_1.threads[0]);
  });

  it('memetakan semaphore dan condition, serta maxTicks default', () => {
    const level: LevelDefinition = {
      ...level1_1,
      maxTicks: undefined,
      resources: [
        { kind: 'mutex', id: 'm' },
        { kind: 'semaphore', id: 'mesin', initialValue: 3 },
        { kind: 'condition', id: 'siap', mutex: 'm' },
      ],
    };
    const config = buildEngineConfig(level, []);
    expect(config.mutexes).toEqual(['m']);
    expect(config.semaphores).toEqual({ mesin: 3 });
    expect(config.conditions).toEqual(['siap']);
    expect(config.maxTicks).toBe(DEFAULT_MAX_TICKS);
  });

  it('melempar error bila alat tidak valid (diteruskan dari applyTools)', () => {
    const rusak: PlacedTool = { ...papan, spans: [{ thread: 'Z', start: 0, end: 1 }] };
    expect(() => buildEngineConfig(level1_1, [rusak])).toThrow(/tidak ada/);
  });
});