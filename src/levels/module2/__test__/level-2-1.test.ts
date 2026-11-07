import { describe, expect, it } from 'vitest';
import { evaluateLevel } from '../../../controller/evaluateLevel';
import { buildEngineConfig } from '../../../controller/buildEngineConfig';
import { Engine } from '../../../engine/engine';
import type { EngineConfig, ThreadDef } from '../../../engine/types';
import { level2_1 } from '../level-2-1';

function run(config: EngineConfig, seed: number) {
  const engine = new Engine();
  engine.load(config, seed);
  while (!engine.isFinished) engine.step();
  return engine.getSnapshot();
}

/** Program yang SUDAH diberi tiga pengaman (meniru hasil alat T-098). */
function guardedThreads(): ThreadDef[] {
  return level2_1.threads.map((t) => {
    const isProducer = t.id.startsWith('P');
    return {
      ...t,
      program: isProducer
        ? [
            { op: 'WORK', ticks: 1 },
            { op: 'SEM_WAIT', sem: 'empty' },
            { op: 'PUT_ITEM', buffer: 'ban' },
            { op: 'SEM_SIGNAL', sem: 'full' },
          ]
        : [
            { op: 'SEM_WAIT', sem: 'full' },
            { op: 'TAKE_ITEM', buffer: 'ban' },
            { op: 'SEM_SIGNAL', sem: 'empty' },
            { op: 'WORK', ticks: 1 },
          ],
    };
  });
}

describe('Level 2-1: Ban Berjalan (T-050)', () => {
  it('konfigurasi: 2 perakit, 2 pengepak, ban kapasitas 3, level modul 2', () => {
    expect(level2_1.module).toBe(2);
    expect(level2_1.threads).toHaveLength(4);
    expect(level2_1.buffers).toEqual({ ban: 3 });
  });

  it('buildEngineConfig meneruskan buffers ke engine', () => {
    expect(buildEngineConfig(level2_1, []).buffers).toEqual({ ban: 3 });
  });

  it('tanpa pengaman: underflow terjadi pada banyak seed dan level gagal', () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      const snap = run(buildEngineConfig(level2_1, []), seed);
      expect(snap.underflowCount, `seed ${seed}`).toBeGreaterThan(0);
      expect(evaluateLevel(level2_1, snap).ok, `seed ${seed}`).toBe(false);
    }
  });

  it('dengan semaphore empty dan full: lulus tanpa overflow/underflow pada 200 seed', () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      const base = buildEngineConfig(level2_1, []);
      const snap = run({ ...base, threads: guardedThreads() }, seed);
      expect(snap.overflowCount, `seed ${seed}`).toBe(0);
      expect(snap.underflowCount, `seed ${seed}`).toBe(0);
      expect(snap.buffers[0]?.totalTaken, `seed ${seed}`).toBe(8);
      expect(evaluateLevel(level2_1, snap).ok, `seed ${seed}`).toBe(true);
    }
  });
});
