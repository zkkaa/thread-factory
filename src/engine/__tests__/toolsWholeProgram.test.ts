import { describe, expect, it } from 'vitest';
import { applyTools, applyToolsDetailed, type PlacedTool } from '../tools';
import type { Instruction, ThreadDef } from '../types';

const PROGRAM: Instruction[] = [
  { op: 'WORK', ticks: 1 },
  { op: 'READ', from: 'stok', into: 'r' },
  { op: 'COMPUTE', reg: 'r', add: 1 },
  { op: 'WRITE', reg: 'r', to: 'stok' },
];

function robots(): ThreadDef[] {
  return ['A', 'B'].map((id) => ({
    id,
    label: `Robot ${id}`,
    program: PROGRAM.map((i) => ({ ...i })),
    repeat: 5,
  }));
}

function door(start: number, end: number): PlacedTool {
  return {
    id: 'pintu',
    kind: 'mutex',
    mutex: 'papan',
    spans: ['A', 'B'].map((thread) => ({ thread, start, end })),
  };
}

function names(program: Instruction[]): string[] {
  return program.map((i) =>
    i.op === 'LOCK' || i.op === 'UNLOCK' ? `${i.op}:${i.mutex}` : i.op,
  );
}

describe('pintu yang menutupi WORK (T-037, Level 1-2)', () => {
  it('pintu masuk di slot 0 dan keluar di slot 4 menutupi semua instruksi', () => {
    const [a] = applyTools(robots(), [door(0, 3)]);
    expect(names(a.program)).toEqual([
      'LOCK:papan',
      'WORK',
      'READ',
      'COMPUTE',
      'WRITE',
      'UNLOCK:papan',
    ]);
  });

  it('pintu yang hanya menutupi WORK (start 0, end 0) sah', () => {
    const [a] = applyTools(robots(), [door(0, 0)]);
    expect(names(a.program)).toEqual([
      'LOCK:papan',
      'WORK',
      'UNLOCK:papan',
      'READ',
      'COMPUTE',
      'WRITE',
    ]);
  });

  it('peta asal: LOCK di slot 0, UNLOCK di slot 4', () => {
    const { origins } = applyToolsDetailed(robots(), [door(0, 3)]);
    const list = origins.A;
    expect(list[0]).toEqual({ kind: 'inserted', op: 'LOCK', slot: 0 });
    expect(list[1]).toEqual({ kind: 'original', index: 0 });
    expect(list[list.length - 1]).toEqual({
      kind: 'inserted',
      op: 'UNLOCK',
      slot: 4,
    });
  });

  it('LOCK dan UNLOCK seimbang dan masukan tidak termutasi', () => {
    const input = robots();
    const out = applyTools(input, [door(0, 3)]);
    for (const thread of out) {
      const locks = thread.program.filter((i) => i.op === 'LOCK').length;
      const unlocks = thread.program.filter((i) => i.op === 'UNLOCK').length;
      expect(locks).toBe(1);
      expect(unlocks).toBe(1);
    }
    expect(input[0].program).toHaveLength(4);
  });
});
