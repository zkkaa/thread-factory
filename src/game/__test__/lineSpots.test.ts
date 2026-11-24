import { describe, expect, it } from 'vitest';
import { applyToolsDetailed, type PlacedTool } from '../../engine/tools';
import { level1_5 } from '../../levels/module1/level-1-5.old';
import { layout1_5Line as layout } from '../layouts/level-1-5.line.layout';
import {
  lineAnchorX,
  lineCheckpointLabel,
  lineGates,
  lineRobotX,
} from '../lineSpots';

const MUTEX: PlacedTool = {
  id: 'mutex:meja',
  kind: 'mutex',
  mutex: 'meja',
  spans: level1_5.threads.map((t) => ({ thread: t.id, start: 1, end: 3 })),
};

describe('lineSpots', () => {
  it('tanpa alat, x tiap instruksi sama dengan checkpointX', () => {
    const { origins } = applyToolsDetailed(level1_5.threads, []);
    expect(lineAnchorX(origins['A'] ?? [], layout)).toEqual(layout.checkpointX);
  });

  it('LOCK dan UNLOCK sisipan berada di x slotnya', () => {
    const { threads, origins } = applyToolsDetailed(level1_5.threads, [MUTEX]);
    const first = threads[0];
    if (first === undefined) throw new Error('thread kosong');
    const xs = lineAnchorX(origins[first.id] ?? [], layout);
    expect(xs).toHaveLength(first.program.length);
    expect(xs).toContain(layout.slotX[1]);
    expect(xs).toContain(layout.slotX[4]);
  });

  it('lineGates menemukan pintu masuk (slot 1) dan keluar (slot 4)', () => {
    const { threads, origins } = applyToolsDetailed(level1_5.threads, [MUTEX]);
    const first = threads[0];
    if (first === undefined) throw new Error('thread kosong');
    const gates = lineGates(first.program, origins[first.id] ?? [], layout);
    expect(gates).toEqual([
      { kind: 'mutex', role: 'entry', x: layout.slotX[1] },
      { kind: 'mutex', role: 'exit', x: layout.slotX[4] },
    ]);
  });

  it('tanpa alat tidak ada gerbang', () => {
    const { threads, origins } = applyToolsDetailed(level1_5.threads, []);
    const first = threads[0];
    if (first === undefined) throw new Error('thread kosong');
    expect(lineGates(first.program, origins[first.id] ?? [], layout)).toEqual(
      [],
    );
  });

  it('lineRobotX menjepit pc di luar rentang', () => {
    const xs = [10, 20, 30];
    expect(lineRobotX(-1, xs)).toBe(10);
    expect(lineRobotX(1, xs)).toBe(20);
    expect(lineRobotX(99, xs)).toBe(30);
    expect(lineRobotX(0, [])).toBe(0);
  });

  it('label checkpoint pendek untuk instruksi panjang', () => {
    expect(lineCheckpointLabel({ op: 'ENTER_AREA', area: 'aula' })).toBe(
      'ENTER',
    );
    expect(lineCheckpointLabel({ op: 'WORK', ticks: 1 })).toBe('WORK');
  });
});
