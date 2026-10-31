import { describe, expect, it } from 'vitest';
import { applyToolsDetailed, type PlacedTool } from '../../engine/tools';
import { level1_1 } from '../../levels/module1/level-1-1';
import { computeAnchors } from '../anchors';
import { layout1_1 } from '../layouts/level-1-1.layout';

const tool: PlacedTool = {
  id: 't1',
  kind: 'mutex',
  mutex: 'papan',
  spans: [
    { thread: 'A', start: 1, end: 3 },
    { thread: 'B', start: 1, end: 3 },
  ],
};

describe('computeAnchors', () => {
  it('tanpa alat: tiap instruksi di checkpoint-nya', () => {
    const { origins } = applyToolsDetailed(level1_1.threads, []);
    const anchors = computeAnchors(origins['A'] ?? [], layout1_1);
    expect(anchors.map((a) => a.fraction)).toEqual(layout1_1.checkpoints);
    expect(anchors.every((a) => a.kind === 'checkpoint')).toBe(true);
  });

  it('dengan mutex: LOCK/UNLOCK berada di gerbang pada slotnya', () => {
    const { origins } = applyToolsDetailed(level1_1.threads, [tool]);
    const anchors = computeAnchors(origins['A'] ?? [], layout1_1);
    expect(anchors).toEqual([
      { kind: 'checkpoint', fraction: 0.105 },
      { kind: 'gate', fraction: 0.265 },
      { kind: 'checkpoint', fraction: 0.355 },
      { kind: 'checkpoint', fraction: 0.605 },
      { kind: 'checkpoint', fraction: 0.855 },
      { kind: 'gate', fraction: 0.945 },
    ]);
  });

  it('melempar error bila layout tidak cocok dengan program', () => {
    const { origins } = applyToolsDetailed(level1_1.threads, []);
    const short = { ...layout1_1, checkpoints: [0.1] };
    expect(() => computeAnchors(origins['A'] ?? [], short)).toThrow();
  });
});
