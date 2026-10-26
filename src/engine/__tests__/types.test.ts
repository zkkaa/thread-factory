import { describe, it, expect } from 'vitest';
import { applyTools, type PlacedTool } from '../tools';
import type { Instruction, ThreadDef } from '../types';

function makeRobots(): ThreadDef[] {
  const program: Instruction[] = [
    { op: 'WORK', ticks: 1 },
    { op: 'READ', from: 'stok', into: 'r' },
    { op: 'COMPUTE', reg: 'r', add: 1 },
    { op: 'WRITE', reg: 'r', to: 'stok' },
  ];
  return [
    {
      id: 'A',
      label: 'Robot A',
      program: program.map((i) => ({ ...i })),
      repeat: 5,
    },
    {
      id: 'B',
      label: 'Robot B',
      program: program.map((i) => ({ ...i })),
      repeat: 5,
    },
  ];
}

function labels(program: Instruction[]): string[] {
  return program.map((ins) =>
    ins.op === 'LOCK' || ins.op === 'UNLOCK'
      ? `${ins.op}:${ins.mutex}`
      : ins.op,
  );
}

function door(
  spans: PlacedTool['spans'],
  id = 't1',
  mutex = 'pintu',
): PlacedTool {
  return { id, kind: 'mutex', mutex, spans };
}

describe('applyTools', () => {
  it('menyisipkan LOCK sebelum dan UNLOCK sesudah rentang (Level 1-1)', () => {
    const tool = door([
      { thread: 'A', start: 1, end: 3 },
      { thread: 'B', start: 1, end: 3 },
    ]);
    const [a, b] = applyTools(makeRobots(), [tool]);
    const expected = [
      'WORK',
      'LOCK:pintu',
      'READ',
      'COMPUTE',
      'WRITE',
      'UNLOCK:pintu',
    ];
    expect(labels(a.program)).toEqual(expected);
    expect(labels(b.program)).toEqual(expected);
  });

  it('LOCK dan UNLOCK seimbang pada setiap thread', () => {
    const tools = [
      door([{ thread: 'A', start: 0, end: 3 }], 't1', 'luar'),
      door([{ thread: 'A', start: 1, end: 2 }], 't2', 'dalam'),
    ];
    const [a] = applyTools(makeRobots(), tools);
    const ops = labels(a.program);
    const locks = ops.filter((o) => o.startsWith('LOCK')).length;
    const unlocks = ops.filter((o) => o.startsWith('UNLOCK')).length;
    expect(locks).toBe(2);
    expect(unlocks).toBe(2);
  });

  it('tidak mengubah input dan mengembalikan objek baru', () => {
    const threads = makeRobots();
    const salinan = structuredClone(threads);
    const tool = door([{ thread: 'A', start: 1, end: 3 }]);
    const hasil = applyTools(threads, [tool]);
    expect(threads).toEqual(salinan);
    expect(hasil[0]).not.toBe(threads[0]);
    expect(hasil[0].program).not.toBe(threads[0].program);
  });

  it('tanpa alat, program tetap sama tetapi objeknya baru', () => {
    const threads = makeRobots();
    const hasil = applyTools(threads, []);
    expect(hasil).toEqual(threads);
    expect(hasil[0]).not.toBe(threads[0]);
  });

  it('hanya thread yang punya rentang yang berubah', () => {
    const threads = makeRobots();
    const [a, b] = applyTools(threads, [
      door([{ thread: 'A', start: 1, end: 3 }]),
    ]);
    expect(a.program).toHaveLength(6);
    expect(b.program).toEqual(threads[1].program);
  });

  it('mempertahankan label dan repeat', () => {
    const [a] = applyTools(makeRobots(), [
      door([{ thread: 'A', start: 1, end: 3 }]),
    ]);
    expect(a.label).toBe('Robot A');
    expect(a.repeat).toBe(5);
  });

  it('rentang di tepi program: LOCK paling awal, UNLOCK paling akhir', () => {
    const [a] = applyTools(makeRobots(), [
      door([{ thread: 'A', start: 0, end: 3 }]),
    ]);
    const ops = labels(a.program);
    expect(ops[0]).toBe('LOCK:pintu');
    expect(ops[ops.length - 1]).toBe('UNLOCK:pintu');
  });

  it('rentang satu ubin (start = end) tetap valid', () => {
    const [a] = applyTools(makeRobots(), [
      door([{ thread: 'A', start: 2, end: 2 }]),
    ]);
    expect(labels(a.program)).toEqual([
      'WORK',
      'READ',
      'LOCK:pintu',
      'COMPUTE',
      'UNLOCK:pintu',
      'WRITE',
    ]);
  });

  it('mutex berbeda boleh bersarang: yang luar dikunci dulu, dilepas terakhir', () => {
    const tools = [
      door([{ thread: 'A', start: 1, end: 3 }], 't1', 'luar'),
      door([{ thread: 'A', start: 2, end: 2 }], 't2', 'dalam'),
    ];
    const [a] = applyTools(makeRobots(), tools);
    expect(labels(a.program)).toEqual([
      'WORK',
      'LOCK:luar',
      'READ',
      'LOCK:dalam',
      'COMPUTE',
      'UNLOCK:dalam',
      'WRITE',
      'UNLOCK:luar',
    ]);
  });

  it('dua mutex dengan rentang sama: urutan mengikuti urutan pemasangan', () => {
    const tools = [
      door([{ thread: 'A', start: 1, end: 3 }], 't1', 'm1'),
      door([{ thread: 'A', start: 1, end: 3 }], 't2', 'm2'),
    ];
    const [a] = applyTools(makeRobots(), tools);
    expect(labels(a.program)).toEqual([
      'WORK',
      'LOCK:m1',
      'LOCK:m2',
      'READ',
      'COMPUTE',
      'WRITE',
      'UNLOCK:m2',
      'UNLOCK:m1',
    ]);
  });

  it('rentang mutex yang sama yang bersebelahan (tidak tumpang tindih) diizinkan', () => {
    const tools = [
      door([{ thread: 'A', start: 0, end: 1 }], 't1'),
      door([{ thread: 'A', start: 2, end: 3 }], 't2'),
    ];
    const [a] = applyTools(makeRobots(), tools);
    expect(labels(a.program)).toEqual([
      'LOCK:pintu',
      'WORK',
      'READ',
      'UNLOCK:pintu',
      'LOCK:pintu',
      'COMPUTE',
      'WRITE',
      'UNLOCK:pintu',
    ]);
  });

  describe('input tidak valid melempar error', () => {
    it('rentang mutex yang sama tumpang tindih', () => {
      const tools = [
        door([{ thread: 'A', start: 0, end: 2 }], 't1'),
        door([{ thread: 'A', start: 2, end: 3 }], 't2'),
      ];
      expect(() => applyTools(makeRobots(), tools)).toThrow(/tumpang tindih/);
    });

    it('mutex berbeda saling silang', () => {
      const tools = [
        door([{ thread: 'A', start: 0, end: 2 }], 't1', 'm1'),
        door([{ thread: 'A', start: 1, end: 3 }], 't2', 'm2'),
      ];
      expect(() => applyTools(makeRobots(), tools)).toThrow(/silang/);
    });

    it('thread tidak dikenal', () => {
      const tool = door([{ thread: 'Z', start: 0, end: 1 }]);
      expect(() => applyTools(makeRobots(), [tool])).toThrow(/tidak ada/);
    });

    it('start lebih besar dari end', () => {
      const tool = door([{ thread: 'A', start: 3, end: 1 }]);
      expect(() => applyTools(makeRobots(), [tool])).toThrow(/lebih besar/);
    });

    it('rentang di luar program', () => {
      expect(() =>
        applyTools(makeRobots(), [door([{ thread: 'A', start: 0, end: 4 }])]),
      ).toThrow(/di luar program/);
      expect(() =>
        applyTools(makeRobots(), [door([{ thread: 'A', start: -1, end: 2 }])]),
      ).toThrow(/di luar program/);
    });

    it('indeks bukan bilangan bulat', () => {
      const tool = door([{ thread: 'A', start: 0.5, end: 2 }]);
      expect(() => applyTools(makeRobots(), [tool])).toThrow(/bilangan bulat/);
    });

    it('id alat ganda', () => {
      const tools = [
        door([{ thread: 'A', start: 0, end: 1 }], 'sama', 'm1'),
        door([{ thread: 'B', start: 0, end: 1 }], 'sama', 'm2'),
      ];
      expect(() => applyTools(makeRobots(), tools)).toThrow(
        /lebih dari sekali/,
      );
    });
  });
});
