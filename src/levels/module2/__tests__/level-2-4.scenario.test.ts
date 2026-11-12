import { describe, expect, it } from 'vitest';
import { Engine } from '../../../engine/engine';
import type { PlacedSemaphorePairTool } from '../../../engine/tools';
import { LEVEL_2_1_THREADS, level2_1 } from '../level-2-1';
import { LEVEL_2_2_THREADS, level2_2 } from '../level-2-2';
import { LEVEL_2_3_FORKS, LEVEL_2_3_THREADS } from '../level-2-3.scenario';
import { buildLevel24ScenarioConfig } from '../level-2-4.scenario';

describe('Skenario gabungan Level 2-4 (T-061)', () => {
  it('menggabungkan Producer-Consumer, Readers-Writers, dan Dining Philosophers', () => {
    const config = buildLevel24ScenarioConfig();
    const expectedThreads = [
      ...LEVEL_2_1_THREADS,
      ...LEVEL_2_2_THREADS,
      ...LEVEL_2_3_THREADS,
    ];

    expect(config.threads.map((thread) => thread.id)).toEqual(
      expectedThreads.map((thread) => thread.id),
    );
    expect(config.buffers).toEqual({ ban: level2_1.buffers?.ban });
    expect(config.boards).toContain('papan');
    expect(config.rwLocks).toEqual({ 'kunci-papan': 'reader' });
    expect(config.mutexes).toEqual(['ban-lock', ...LEVEL_2_3_FORKS]);
    expect(config.semaphores).toEqual({
      empty: level2_1.buffers?.ban,
      full: 0,
      kursi: LEVEL_2_3_THREADS.length,
    });
    expect(config.starvationTicks).toBe(level2_2.starvationTicks);
    expect(config.recovery).toBe('manual');
  });

  it('hasil gabungan bisa dimuat engine dengan seluruh resource aktif', () => {
    const engine = new Engine();
    engine.load(buildLevel24ScenarioConfig(), 10);

    const snapshot = engine.getSnapshot();
    expect(snapshot.threads).toHaveLength(
      LEVEL_2_1_THREADS.length +
        LEVEL_2_2_THREADS.length +
        LEVEL_2_3_THREADS.length,
    );
    expect(snapshot.buffers).toHaveLength(1);
    expect(snapshot.boards).toHaveLength(1);
    expect(snapshot.rwLocks).toHaveLength(1);
    expect(snapshot.mutexes).toHaveLength(LEVEL_2_3_FORKS.length + 1);
  });

  it('alat yang dipasang dapat menyasar thread di salah satu area gabungan', () => {
    const beltTool: PlacedSemaphorePairTool = {
      id: 'penjaga-ban',
      kind: 'semaphorePair',
      waitSem: 'empty',
      signalSem: 'full',
      spans: [{ thread: 'P1', start: 0, end: 1 }],
    };

    const config = buildLevel24ScenarioConfig([beltTool]);
    const producer = config.threads.find((thread) => thread.id === 'P1');

    expect(producer?.program.slice(0, 4)).toEqual([
      { op: 'SEM_WAIT', sem: 'empty' },
      { op: 'WORK', ticks: 1 },
      { op: 'PUT_ITEM', buffer: 'ban' },
      { op: 'SEM_SIGNAL', sem: 'full' },
    ]);
  });
});
