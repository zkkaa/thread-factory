import { describe, expect, it } from 'vitest';
import { buildEngineConfig } from '../../controller/buildEngineConfig';
import { evaluateLevel } from '../../controller/evaluateLevel';
import { Engine } from '../../engine/engine';
import type { PlacedConditionTool, PlacedTool } from '../../engine/tools';
import { level1_3 } from '../../levels/module1/level-1-3';
import { level1_4 } from '../../levels/module1/level-1-4';
import { deriveResultView } from '../resultView';

const LAMPU: PlacedConditionTool = {
  id: 'condition:lampu',
  kind: 'condition',
  cond: 'lampu',
  mutex: 'meja',
  waiter: { thread: 'P', index: 0 },
  signaler: { thread: 'A', slot: 4 },
  spans: [],
};

function viewOf(tools: PlacedTool[]) {
  const engine = new Engine();
  engine.load(buildEngineConfig(level1_4, tools), 10);
  while (!engine.isFinished) engine.step();
  const snapshot = engine.getSnapshot();
  return deriveResultView(
    level1_4,
    snapshot,
    evaluateLevel(level1_4, snapshot),
  );
}

describe('deriveResultView: level berbaterai (Level 1-4)', () => {
  it('tanpa alat: gelembung membahas busy waiting, bukan "Seharusnya 3, hasilnya 3"', () => {
    const view = viewOf([]);
    expect(view.ok).toBe(false);
    expect(view.quote).not.toMatch(/Seharusnya/);
    expect(view.quote).toMatch(/sia-sia/);
    expect(view.keyFigure.label).toBe('Baterai');
    expect(view.keyFigure.match).toBe(false);
    expect(view.cards.map((c) => c.label)).not.toContain('Pembaruan hilang');
    expect(view.criteria[0]?.label).toMatch(/baterai hemat/);
  });

  it('dengan Lampu Sinyal: gelembung memuji baterai hemat', () => {
    const view = viewOf([LAMPU]);
    expect(view.ok).toBe(true);
    expect(view.quote).toMatch(/Baterai masih 100%/);
    expect(view.keyFigure.match).toBe(true);
    expect(view.cards[0]?.value).toBe('0');
  });

  it('level tanpa busy waiting tetap memakai pola lama', () => {
    const engine = new Engine();
    engine.load(buildEngineConfig(level1_3, []), 10);
    while (!engine.isFinished) engine.step();
    const snapshot = engine.getSnapshot();
    const view = deriveResultView(
      level1_3,
      snapshot,
      evaluateLevel(level1_3, snapshot),
    );
    expect(view.keyFigure.label).toBe('Bentrok');
  });
});
