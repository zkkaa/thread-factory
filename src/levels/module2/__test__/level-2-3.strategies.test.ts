import { describe, expect, it } from 'vitest';
import { Engine } from '../../../engine/engine';
import type {
  EngineConfig,
  Instruction,
  SimEvent,
} from '../../../engine/types';
import {
  LEVEL_2_3_MAX_SEATED,
  LEVEL_2_3_SEAT_SEMAPHORE,
  LEVEL_2_3_TECHNICIANS,
  LEVEL_2_3_THREADS,
  buildLevel23StrategyConfig,
  leftFork,
  rightFork,
  strategyProgram,
  type TechnicianStrategy,
} from '../level-2-3.scenario';

const SEEDS = 200;
const SAFE_STRATEGIES: TechnicianStrategy[] = [
  'ordered',
  'limit4',
  'asymmetric',
];

function run(config: EngineConfig, seed: number) {
  const engine = new Engine();
  engine.load(config, seed);
  const events: SimEvent[] = [];
  while (!engine.isFinished) events.push(...engine.step().events);
  return { events, snap: engine.getSnapshot() };
}

function lockOrder(program: Instruction[]): string[] {
  return program.flatMap((ins) => (ins.op === 'LOCK' ? [ins.mutex] : []));
}

describe('Level 2-3: strategi pencegahan deadlock (T-057)', () => {
  it('none: program sama dengan skenario T-056 dan tetap deadlock', () => {
    for (let i = 0; i < LEVEL_2_3_TECHNICIANS; i += 1) {
      expect(strategyProgram(i, 'none')).toEqual(LEVEL_2_3_THREADS[i]?.program);
    }

    const { events } = run(buildLevel23StrategyConfig('none'), 1);
    expect(events.filter((e) => e.type === 'DEADLOCK_DETECTED')).toHaveLength(1);
  });

  it.each(SAFE_STRATEGIES)(
    '%s: bebas deadlock dan semua teknisi selesai pada 200 seed',
    (strategy) => {
      for (let seed = 1; seed <= SEEDS; seed += 1) {
        const { events, snap } = run(buildLevel23StrategyConfig(strategy), seed);
        const label = `${strategy} seed ${seed}`;

        expect(
          events.some((e) => e.type === 'DEADLOCK_DETECTED'),
          label,
        ).toBe(false);
        expect(
          snap.threads.every((t) => t.state === 'TERMINATED'),
          label,
        ).toBe(true);
      }
    },
  );

  it('ordered: tiap teknisi mengambil kunci bernomor kecil lebih dulu', () => {
    for (let i = 0; i < LEVEL_2_3_TECHNICIANS; i += 1) {
      const order = lockOrder(strategyProgram(i, 'ordered'));
      expect(order, `teknisi ${i + 1}`).toEqual([...order].sort());
    }
  });

  it('asymmetric: nomor genap ambil kiri dulu, nomor ganjil ambil kanan dulu', () => {
    for (let i = 0; i < LEVEL_2_3_TECHNICIANS; i += 1) {
      const first = lockOrder(strategyProgram(i, 'asymmetric'))[0];
      const isEven = (i + 1) % 2 === 0;
      expect(first, `teknisi ${i + 1}`).toBe(isEven ? leftFork(i) : rightFork(i));
    }
  });

  it('limit4: SEM_WAIT di awal, SEM_SIGNAL di akhir, semaphore bernilai 4', () => {
    const config = buildLevel23StrategyConfig('limit4');
    expect(config.semaphores).toEqual({ [LEVEL_2_3_SEAT_SEMAPHORE]: 4 });
    expect(LEVEL_2_3_MAX_SEATED).toBe(4);

    for (let i = 0; i < LEVEL_2_3_TECHNICIANS; i += 1) {
      const program = strategyProgram(i, 'limit4');
      expect(program[0]).toEqual({ op: 'SEM_WAIT', sem: LEVEL_2_3_SEAT_SEMAPHORE });
      expect(program[program.length - 1]).toEqual({
        op: 'SEM_SIGNAL',
        sem: LEVEL_2_3_SEAT_SEMAPHORE,
      });
    }
  });

  it('strategi lain tidak memakai semaphore', () => {
    for (const strategy of ['none', 'ordered', 'asymmetric'] as const) {
      expect(buildLevel23StrategyConfig(strategy).semaphores).toEqual({});
    }
  });

  it('limit4 dengan nilai 5 tidak membatasi apa pun: deadlock masih muncul', () => {
    const config = {
      ...buildLevel23StrategyConfig('limit4'),
      semaphores: { [LEVEL_2_3_SEAT_SEMAPHORE]: LEVEL_2_3_TECHNICIANS },
    };

    let deadlocks = 0;
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const { events } = run(config, seed);
      if (events.some((e) => e.type === 'DEADLOCK_DETECTED')) deadlocks += 1;
    }
    expect(deadlocks).toBeGreaterThan(0);
  });
});