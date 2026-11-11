import { describe, expect, it } from 'vitest';
import { Engine } from '../../../engine/engine';
import type { EngineConfig, SimEvent } from '../../../engine/types';
import {
  LEVEL_2_3_FORKS,
  LEVEL_2_3_THREADS,
  buildLevel23Config,
  leftFork,
  rightFork,
} from '../level-2-3.scenario';

function run(config: EngineConfig, seed: number) {
  const engine = new Engine();
  engine.load(config, seed);
  const events: SimEvent[] = [];
  while (!engine.isFinished) events.push(...engine.step().events);
  return { events, snap: engine.getSnapshot() };
}

describe('Level 2-3: skenario meja teknisi (T-056)', () => {
  it('lima teknisi, lima kunci, tiap teknisi memakai dua kunci bertetangga', () => {
    expect(LEVEL_2_3_THREADS).toHaveLength(5);
    expect(LEVEL_2_3_FORKS).toHaveLength(5);

    LEVEL_2_3_THREADS.forEach((thread, i) => {
      expect(thread.program[0]).toEqual({ op: 'LOCK', mutex: leftFork(i) });
      expect(thread.program[1]).toEqual({ op: 'LOCK', mutex: rightFork(i) });
      expect(leftFork(i)).not.toBe(rightFork(i));
      // kunci kanan teknisi i = kunci kiri teknisi berikutnya (meja bundar)
      expect(rightFork(i)).toBe(leftFork(i + 1));
    });
  });

  it('tanpa strategi: deadlock pada 200 seed, siklus berisi kelima teknisi', () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      const { events, snap } = run(buildLevel23Config(), seed);
      const deadlocks = events.filter((e) => e.type === 'DEADLOCK_DETECTED');

      expect(deadlocks, `seed ${seed}`).toHaveLength(1);
      expect(deadlocks[0], `seed ${seed}`).toMatchObject({
        cycle: ['T1', 'T2', 'T3', 'T4', 'T5'],
      });
      // semua macet: tiap teknisi menunggu, tiap kunci dipegang satu orang
      expect(snap.threads.every((t) => t.state === 'WAITING')).toBe(true);
      expect(snap.mutexes.every((m) => m.owner !== null)).toBe(true);
      expect(snap.tick).toBeLessThanOrEqual(5);
    }
  });

  it('satu teknisi sendirian tidak deadlock dan selesai makan', () => {
    const first = LEVEL_2_3_THREADS[0];
    expect(first).toBeDefined();
    if (first === undefined) return;

    const { events, snap } = run(buildLevel23Config([first]), 1);
    expect(events.some((e) => e.type === 'DEADLOCK_DETECTED')).toBe(false);
    expect(snap.threads[0]?.state).toBe('TERMINATED');
  });
});