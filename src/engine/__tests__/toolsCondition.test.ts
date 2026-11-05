import { describe, expect, it } from 'vitest';
import {
  applyTools,
  applyToolsDetailed,
  type PlacedConditionTool,
  type PlacedMutexTool,
} from '../tools';
import type { ThreadDef } from '../types';

function makeThreads(): ThreadDef[] {
  return [
    {
      id: 'A',
      label: 'Perakit',
      program: [
        { op: 'WORK', ticks: 18 },
        { op: 'READ', from: 'barang', into: 'r' },
        { op: 'COMPUTE', reg: 'r', add: 3 },
        { op: 'WRITE', reg: 'r', to: 'barang' },
      ],
      repeat: 1,
    },
    {
      id: 'P',
      label: 'Pengepak',
      program: [
        { op: 'SPIN_UNTIL', variable: 'barang', atLeast: 3 },
        { op: 'WORK', ticks: 3 },
      ],
      repeat: 1,
    },
  ];
}

function conditionTool(
  overrides: Partial<PlacedConditionTool> = {},
): PlacedConditionTool {
  return {
    id: 'condition:lampu',
    kind: 'condition',
    cond: 'lampu',
    mutex: 'meja',
    waiter: { thread: 'P', index: 0 },
    signaler: { thread: 'A', slot: 4 },
    spans: [],
    ...overrides,
  };
}

describe('PlacedConditionTool dan applyTools (T-091)', () => {
  it('mengganti SPIN_UNTIL penunggu menjadi LOCK, COND_WAIT, UNLOCK', () => {
    const [, packer] = applyTools(makeThreads(), [conditionTool()]);
    expect(packer.program).toEqual([
      { op: 'LOCK', mutex: 'meja' },
      { op: 'COND_WAIT', cond: 'lampu', mutex: 'meja' },
      { op: 'UNLOCK', mutex: 'meja' },
      { op: 'WORK', ticks: 3 },
    ]);
  });

  it('menyisipkan LOCK, COND_SIGNAL, UNLOCK pada slot pemberi sinyal', () => {
    const [assembler] = applyTools(makeThreads(), [conditionTool()]);
    expect(assembler.program.slice(-3)).toEqual([
      { op: 'LOCK', mutex: 'meja' },
      { op: 'COND_SIGNAL', cond: 'lampu' },
      { op: 'UNLOCK', mutex: 'meja' },
    ]);
    expect(assembler.program).toHaveLength(7);
  });

  it('slot di tengah program menyisip sebelum instruksi asli ke-slot', () => {
    const [assembler] = applyTools(makeThreads(), [
      conditionTool({ signaler: { thread: 'A', slot: 1 } }),
    ]);
    expect(assembler.program.map((i) => i.op)).toEqual([
      'WORK',
      'LOCK',
      'COND_SIGNAL',
      'UNLOCK',
      'READ',
      'COMPUTE',
      'WRITE',
    ]);
  });

  it('peta asal: replaced untuk pengganti, inserted untuk sisipan', () => {
    const { origins } = applyToolsDetailed(makeThreads(), [conditionTool()]);
    expect(origins['P']).toEqual([
      { kind: 'replaced', op: 'LOCK', index: 0 },
      { kind: 'replaced', op: 'COND_WAIT', index: 0 },
      { kind: 'replaced', op: 'UNLOCK', index: 0 },
      { kind: 'original', index: 1 },
    ]);
    expect(origins['A']).toEqual([
      { kind: 'original', index: 0 },
      { kind: 'original', index: 1 },
      { kind: 'original', index: 2 },
      { kind: 'original', index: 3 },
      { kind: 'inserted', op: 'LOCK', slot: 4 },
      { kind: 'inserted', op: 'COND_SIGNAL', slot: 4 },
      { kind: 'inserted', op: 'UNLOCK', slot: 4 },
    ]);
  });

  it('tidak memutasi thread masukan maupun alat', () => {
    const threads = makeThreads();
    const tool = conditionTool();
    const threadsBefore = JSON.stringify(threads);
    const toolBefore = JSON.stringify(tool);
    applyTools(threads, [tool]);
    expect(JSON.stringify(threads)).toBe(threadsBefore);
    expect(JSON.stringify(tool)).toBe(toolBefore);
  });

  it('indeks rentang mutex lain tetap merujuk program asli', () => {
    const mutexTool: PlacedMutexTool = {
      id: 'mutex:lain',
      kind: 'mutex',
      mutex: 'lain',
      spans: [{ thread: 'A', start: 0, end: 0 }],
    };
    const [assembler] = applyTools(makeThreads(), [mutexTool, conditionTool()]);
    expect(assembler.program.map((i) => i.op)).toEqual([
      'LOCK',
      'WORK',
      'UNLOCK',
      'READ',
      'COMPUTE',
      'WRITE',
      'LOCK',
      'COND_SIGNAL',
      'UNLOCK',
    ]);
  });
});

describe('PlacedConditionTool: input tidak valid', () => {
  it('menolak thread yang tidak ada', () => {
    expect(() =>
      applyTools(makeThreads(), [
        conditionTool({ waiter: { thread: 'X', index: 0 } }),
      ]),
    ).toThrow(/thread "X" yang tidak ada/);
  });

  it('menolak penunggu dan pemberi sinyal yang sama', () => {
    expect(() =>
      applyTools(makeThreads(), [
        conditionTool({ signaler: { thread: 'P', slot: 0 } }),
      ]),
    ).toThrow(/tidak boleh thread yang sama/);
  });

  it('menolak indeks penunggu di luar program', () => {
    for (const index of [-1, 2, 0.5]) {
      expect(() =>
        applyTools(makeThreads(), [
          conditionTool({ waiter: { thread: 'P', index } }),
        ]),
      ).toThrow(/di luar program/);
    }
  });

  it('menolak bila instruksi yang diganti bukan SPIN_UNTIL', () => {
    expect(() =>
      applyTools(makeThreads(), [
        conditionTool({ waiter: { thread: 'P', index: 1 } }),
      ]),
    ).toThrow(/SPIN_UNTIL/);
  });

  it('menolak slot pemberi sinyal di luar 0..panjang program', () => {
    for (const slot of [-1, 5, 1.5]) {
      expect(() =>
        applyTools(makeThreads(), [
          conditionTool({ signaler: { thread: 'A', slot } }),
        ]),
      ).toThrow(/slot pemberi sinyal/);
    }
  });

  it('menolak dua alat yang menggantikan instruksi yang sama', () => {
    expect(() =>
      applyTools(makeThreads(), [
        conditionTool(),
        conditionTool({ id: 'condition:lampu2' }),
      ]),
    ).toThrow(/sudah digantikan/);
  });

  it('menolak id alat ganda', () => {
    expect(() =>
      applyTools(makeThreads(), [conditionTool(), conditionTool()]),
    ).toThrow(/dipakai lebih dari sekali/);
  });
});
