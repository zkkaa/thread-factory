import { describe, expect, it } from 'vitest';
import { applyTools, applyToolsDetailed, type PlacedTool } from '../tools';
import type { ThreadDef } from '../types';

const producer: ThreadDef = {
  id: 'P1',
  label: 'Perakit 1',
  program: [
    { op: 'WORK', ticks: 1 },
    { op: 'PUT_ITEM', buffer: 'ban' },
  ],
  repeat: 4,
};

const consumer: ThreadDef = {
  id: 'C1',
  label: 'Pengepak 1',
  program: [
    { op: 'TAKE_ITEM', buffer: 'ban' },
    { op: 'WORK', ticks: 1 },
  ],
  repeat: 4,
};

const produceGuard: PlacedTool = {
  id: 'guard-producer',
  kind: 'semaphorePair',
  waitSem: 'empty',
  signalSem: 'full',
  spans: [{ thread: 'P1', start: 1, end: 1 }],
};

const consumeGuard: PlacedTool = {
  id: 'guard-consumer',
  kind: 'semaphorePair',
  waitSem: 'full',
  signalSem: 'empty',
  spans: [{ thread: 'C1', start: 0, end: 0 }],
};

describe('alat semaphorePair', () => {
  it('perakit: wait(empty) sebelum PUT_ITEM, signal(full) sesudahnya', () => {
    const [result] = applyTools([producer], [produceGuard]);
    expect(result.program).toEqual([
      { op: 'WORK', ticks: 1 },
      { op: 'SEM_WAIT', sem: 'empty' },
      { op: 'PUT_ITEM', buffer: 'ban' },
      { op: 'SEM_SIGNAL', sem: 'full' },
    ]);
  });

  it('pengepak: wait(full) sebelum TAKE_ITEM, signal(empty) sesudahnya', () => {
    const [result] = applyTools([consumer], [consumeGuard]);
    expect(result.program).toEqual([
      { op: 'SEM_WAIT', sem: 'full' },
      { op: 'TAKE_ITEM', buffer: 'ban' },
      { op: 'SEM_SIGNAL', sem: 'empty' },
      { op: 'WORK', ticks: 1 },
    ]);
  });

  it('peta asal: instruksi sisipan punya slot yang benar', () => {
    const { origins } = applyToolsDetailed([producer], [produceGuard]);
    expect(origins.P1).toEqual([
      { kind: 'original', index: 0 },
      { kind: 'inserted', op: 'SEM_WAIT', slot: 1 },
      { kind: 'original', index: 1 },
      { kind: 'inserted', op: 'SEM_SIGNAL', slot: 2 },
    ]);
  });

  it('kedua alat bersama: masing-masing thread hanya terpengaruh alatnya', () => {
    const result = applyTools(
      [producer, consumer],
      [produceGuard, consumeGuard],
    );
    expect(result[0].program).toHaveLength(4);
    expect(result[1].program).toHaveLength(4);
  });

  it('tidak mengubah masukan', () => {
    const threads = [producer, consumer];
    const placed = [produceGuard, consumeGuard];
    const before = JSON.stringify({ threads, placed });
    applyTools(threads, placed);
    expect(JSON.stringify({ threads, placed })).toBe(before);
  });

  it('menolak semaphore tunggu dan sinyal yang sama', () => {
    const salah: PlacedTool = {
      id: 'salah',
      kind: 'semaphorePair',
      waitSem: 'empty',
      signalSem: 'empty',
      spans: [{ thread: 'P1', start: 1, end: 1 }],
    };
    expect(() => applyTools([producer], [salah])).toThrow(/harus berbeda/);
  });

  it('menolak rentang di luar program', () => {
    const salah: PlacedTool = { ...produceGuard, id: 'luar' } as PlacedTool;
    if (salah.kind !== 'semaphorePair') throw new Error('tipe salah');
    salah.spans = [{ thread: 'P1', start: 0, end: 5 }];
    expect(() => applyTools([producer], [salah])).toThrow(/di luar program/);
  });
});
