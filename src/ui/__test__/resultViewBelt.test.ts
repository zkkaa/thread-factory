import { describe, expect, it } from 'vitest';
import { buildEngineConfig } from '../../controller/buildEngineConfig';
import { evaluateLevel } from '../../controller/evaluateLevel';
import { Engine } from '../../engine/engine';
import type { PlacedTool } from '../../engine/tools';
import { level1_1 } from '../../levels/module1/level-1-1';
import { level2_1 } from '../../levels/module2/level-2-1';
import { buildBeltTool, findBeltSetup } from '../beltTool';
import { deriveResultView } from '../resultView';

function viewOf(tools: PlacedTool[]) {
  const engine = new Engine();
  engine.load(buildEngineConfig(level2_1, tools), 10);
  while (!engine.isFinished) engine.step();
  const snapshot = engine.getSnapshot();
  return deriveResultView(
    level2_1,
    snapshot,
    evaluateLevel(level2_1, snapshot),
  );
}

function guards(which: ('slot' | 'item')[]): PlacedTool[] {
  const setup = findBeltSetup(level2_1);
  if (setup === null) throw new Error('Level 2-1 harus punya setup ban.');
  return which.map((guard) => buildBeltTool(setup, guard));
}

describe('deriveResultView: level berban (Level 2-1)', () => {
  it('kedua penjaga: gelembung menyebut 8 barang sampai', () => {
    const view = viewOf(guards(['slot', 'item']));
    expect(view.ok).toBe(true);
    expect(view.quote).toBe('8 barang sampai, tidak ada yang jatuh.');
    expect(view.keyFigure.label).toBe('Barang sampai');
    expect(view.keyFigure.display).toBe('8 / 8');
    expect(view.keyFigure.match).toBe(true);
    expect(view.cards.map((c) => c.label)).not.toContain('Pembaruan hilang');
  });

  it('tanpa alat: tidak ada kalimat "Seharusnya 0, hasilnya 0"', () => {
    const view = viewOf([]);
    expect(view.ok).toBe(false);
    expect(view.quote).not.toMatch(/Seharusnya/);
    expect(view.keyFigure.match).toBe(false);
  });

  it('hanya Penjaga Barang: gelembung menyebut barang jatuh', () => {
    const view = viewOf(guards(['item']));
    expect(view.ok).toBe(false);
    expect(view.quote).toMatch(/jatuh/);
    expect(view.keyFigure.match).toBe(false);
  });

  it('level tanpa ban tetap memakai pola lama', () => {
    const engine = new Engine();
    engine.load(buildEngineConfig(level1_1, []), 10);
    while (!engine.isFinished) engine.step();
    const snapshot = engine.getSnapshot();
    const view = deriveResultView(
      level1_1,
      snapshot,
      evaluateLevel(level1_1, snapshot),
    );
    expect(view.keyFigure.label).toBe('Stok');
  });
});