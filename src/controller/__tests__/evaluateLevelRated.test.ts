import { describe, it, expect } from 'vitest';
import { Engine } from '../../engine/engine';
import type { PlacedTool } from '../../engine/tools';
import type { Snapshot } from '../../engine/types';
import { level1_1 } from '../../levels/module1/level-1-1';
import { buildEngineConfig } from '../buildEngineConfig';
import { evaluateLevel } from '../evaluateLevel';

const MUTEX_PAS: PlacedTool = {
  id: 'm1',
  kind: 'mutex',
  mutex: 'papan',
  spans: [
    { thread: 'A', start: 1, end: 3 },
    { thread: 'B', start: 1, end: 3 },
  ],
};

function finalSnapshot(tools: PlacedTool[], seed: number): Snapshot {
  const engine = new Engine();
  engine.load(buildEngineConfig(level1_1, tools), seed);
  while (!engine.isFinished) engine.step();
  return engine.getSnapshot() as Snapshot;
}

const SEED = level1_1.tutorialSeed as number;

describe('evaluateLevel: opsi rated', () => {
  it('rated: false pada seed tutorial: lulus tetap dinilai, bintang null', () => {
    const result = evaluateLevel(level1_1, finalSnapshot([MUTEX_PAS], SEED), {
      rated: false,
    });
    expect(result.ok).toBe(true);
    expect(result.stars).toBeNull();
  });

  it('rated: false: gagal tetap gagal, bintang null (bukan 0)', () => {
    const result = evaluateLevel(level1_1, finalSnapshot([], SEED), {
      rated: false,
    });
    expect(result.ok).toBe(false);
    expect(result.stars).toBeNull();
  });

  it('rated: true atau tanpa opsi: perilaku lama (3 bintang)', () => {
    const snapshot = finalSnapshot([MUTEX_PAS], SEED);
    expect(evaluateLevel(level1_1, snapshot).stars).toBe(3);
    expect(evaluateLevel(level1_1, snapshot, { rated: true }).stars).toBe(3);
  });
});
