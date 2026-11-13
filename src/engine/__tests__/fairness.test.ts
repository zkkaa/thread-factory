import { describe, expect, it } from 'vitest';
import { Engine } from '../engine';
import { computeFairness } from '../fairness';
import {
  buildLevel23StrategyConfig,
  LEVEL_2_3_MEALS,
  LEVEL_2_3_TECHNICIANS,
  TECHNICIAN_STRATEGIES,
} from '../../levels/module2/level-2-3.scenario';
const threads = (counts: number[]) =>
  counts.map((iteration, i) => ({ id: `T${i + 1}`, iteration }));

describe('computeFairness: perhitungan', () => {
  it('semua sama: indeks Jain 1 dan tidak ada yang kelaparan', () => {
    const f = computeFairness({ threads: threads([3, 3, 3, 3, 3]) });

    expect(f.totalMeals).toBe(15);
    expect(f.minMeals).toBe(3);
    expect(f.maxMeals).toBe(3);
    expect(f.jainIndex).toBeCloseTo(1);
    expect(f.starved).toEqual([]);
  });

  it('timpang: indeks Jain di bawah 1 dan thread tanpa makan tercatat', () => {
    const f = computeFairness({ threads: threads([3, 3, 0, 1, 3]) });

    expect(f.mealsByThread).toEqual({ T1: 3, T2: 3, T3: 0, T4: 1, T5: 3 });
    expect(f.minMeals).toBe(0);
    expect(f.maxMeals).toBe(3);
    // 10^2 / (5 x 28) = 100/140
    expect(f.jainIndex).toBeCloseTo(100 / 140);
    expect(f.starved).toEqual(['T3']);
  });

  it('satu thread memonopoli: indeks Jain = 1/n', () => {
    const f = computeFairness({ threads: threads([4, 0, 0, 0]) });

    expect(f.jainIndex).toBeCloseTo(0.25);
    expect(f.starved).toEqual(['T2', 'T3', 'T4']);
  });

  it('belum ada yang makan: indeks null dan tidak ada yang dianggap kelaparan', () => {
    const f = computeFairness({ threads: threads([0, 0, 0]) });

    expect(f.totalMeals).toBe(0);
    expect(f.jainIndex).toBeNull();
    expect(f.starved).toEqual([]);
  });

  it('tanpa thread: semua nol dan tidak melempar error', () => {
    const f = computeFairness({ threads: [] });

    expect(f).toEqual({
      mealsByThread: {},
      totalMeals: 0,
      minMeals: 0,
      maxMeals: 0,
      jainIndex: null,
      starved: [],
    });
  });

  it('tidak mengubah masukan', () => {
    const input = { threads: threads([1, 2]) };
    const before = JSON.stringify(input);
    computeFairness(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});

function runToEnd(strategy: (typeof TECHNICIAN_STRATEGIES)[number]) {
  const engine = new Engine();
  engine.load(buildLevel23StrategyConfig(strategy), 1);
  while (!engine.isFinished) engine.step();
  return computeFairness(engine.getSnapshot());
}

describe('computeFairness: Level 2-3 dengan engine sungguhan', () => {
  it('tanpa strategi: deadlock sejak awal, tidak ada yang makan', () => {
    const f = runToEnd('none');

    expect(f.totalMeals).toBe(0);
    expect(f.jainIndex).toBeNull();
  });

  for (const strategy of TECHNICIAN_STRATEGIES.filter((s) => s !== 'none')) {
    it(`strategi ${strategy}: semua teknisi makan penuh dan merata`, () => {
      const f = runToEnd(strategy);

      expect(f.minMeals).toBe(LEVEL_2_3_MEALS);
      expect(f.maxMeals).toBe(LEVEL_2_3_MEALS);
      expect(f.totalMeals).toBe(LEVEL_2_3_MEALS * LEVEL_2_3_TECHNICIANS);
      expect(f.jainIndex).toBeCloseTo(1);
    });
  }
});
