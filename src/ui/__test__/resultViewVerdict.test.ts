import { describe, expect, it } from 'vitest';
import { buildEngineConfig } from '../../controller/buildEngineConfig';
import { evaluateLevel } from '../../controller/evaluateLevel';
import { Engine } from '../../engine/engine';
import { level2_2 } from '../../levels/module2/level-2-2';
import { level2_3 } from '../../levels/module2/level-2-3';
import type { LevelDefinition } from '../../levels/types';
import { deriveResultView } from '../resultView';

function runWithoutTools(level: LevelDefinition) {
  const engine = new Engine();
  engine.load(buildEngineConfig(level, []), level.tutorialSeed ?? 1);
  for (let i = 0; i < 2000 && !engine.isFinished; i += 1) engine.step();
  const snapshot = engine.getSnapshot();
  const result = evaluateLevel(level, snapshot);
  return deriveResultView(level, snapshot, result);
}

describe('popup hasil level verdict (2-2, 2-3)', () => {
  for (const level of [level2_2, level2_3]) {
    it(`Level ${level.id}: gagal tanpa alat, gelembung memakai pesan invariant`, () => {
      const view = runWithoutTools(level);
      expect(view.ok).toBe(false);
      expect(view.quote).not.toContain('Seharusnya 0');
      expect(view.quote.length).toBeGreaterThan(0);
      expect(view.keyFigure.match).toBe(false);
      expect(view.keyFigure.actual).toBe('bermasalah');
    });
  }
});
