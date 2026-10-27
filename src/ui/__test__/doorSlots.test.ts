import { describe, expect, it } from 'vitest';
import {
  buildSharedMutexTool,
  clickSlot,
  describeSlot,
  readSharedDoor,
  slotCount,
  spanFromSlots,
  validExitSlots,
  type ClickState,
} from '../doorSlots';

describe('slot dan span', () => {
  it('program 4 instruksi punya 5 slot', () => {
    expect(slotCount(4)).toBe(5);
  });

  it('masuk slot 1, keluar slot 4 menjadi start 1, end 3', () => {
    expect(spanFromSlots({ entry: 1, exit: 4 })).toEqual({ start: 1, end: 3 });
  });

  it('pintu keluar tidak boleh sebelum atau sama dengan pintu masuk', () => {
    expect(() => spanFromSlots({ entry: 2, exit: 2 })).toThrow();
    expect(() => spanFromSlots({ entry: 3, exit: 1 })).toThrow();
  });

  it('slot keluar yang sah hanya sesudah pintu masuk', () => {
    expect(validExitSlots(1, 4)).toEqual([2, 3, 4]);
    expect(validExitSlots(4, 4)).toEqual([]);
  });

  it('describeSlot menjelaskan awal, tengah, dan akhir', () => {
    const ops = ['WORK', 'READ', 'COMPUTE', 'WRITE'];
    expect(describeSlot(0, ops)).toBe('sebelum WORK');
    expect(describeSlot(2, ops)).toBe('antara READ dan COMPUTE');
    expect(describeSlot(4, ops)).toBe('sesudah WRITE');
  });
});

describe('alat mutex bersama', () => {
  it('berlaku untuk semua robot dan tidak berbagi objek', () => {
    const tool = buildSharedMutexTool('m', ['A', 'B'], { entry: 1, exit: 4 });
    expect(tool).toEqual({
      id: 'mutex:m',
      kind: 'mutex',
      mutex: 'm',
      spans: [
        { thread: 'A', start: 1, end: 3 },
        { thread: 'B', start: 1, end: 3 },
      ],
    });
    expect(tool?.spans[0]).not.toBe(tool?.spans[1]);
  });

  it('tanpa pintu menghasilkan null', () => {
    expect(buildSharedMutexTool('m', ['A', 'B'], null)).toBeNull();
  });

  it('readSharedDoor membalik konversi', () => {
    const tool = buildSharedMutexTool('m', ['A', 'B'], { entry: 1, exit: 4 });
    expect(readSharedDoor(tool)).toEqual({ entry: 1, exit: 4 });
    expect(readSharedDoor(null)).toBeNull();
  });
});

describe('clickSlot', () => {
  const idle: ClickState = { phase: 'idle' };

  it('klik pertama memilih pintu masuk', () => {
    expect(clickSlot(idle, 1, 5)).toEqual({
      state: { phase: 'entry', entry: 1 },
      door: null,
    });
  });

  it('slot terakhir tidak bisa jadi pintu masuk', () => {
    expect(clickSlot(idle, 4, 5)).toEqual({ state: idle, door: null });
  });

  it('klik kedua sesudah pintu masuk memasang pintu', () => {
    expect(clickSlot({ phase: 'entry', entry: 1 }, 4, 5)).toEqual({
      state: idle,
      door: { entry: 1, exit: 4 },
    });
  });

  it('klik slot yang sama atau sebelumnya memindahkan pintu masuk', () => {
    expect(clickSlot({ phase: 'entry', entry: 2 }, 2, 5).state).toEqual({
      phase: 'entry',
      entry: 2,
    });
    expect(clickSlot({ phase: 'entry', entry: 2 }, 0, 5).state).toEqual({
      phase: 'entry',
      entry: 0,
    });
  });

  it('slot di luar jangkauan diabaikan', () => {
    expect(clickSlot(idle, 9, 5)).toEqual({ state: idle, door: null });
    expect(clickSlot(idle, -1, 5)).toEqual({ state: idle, door: null });
  });
});
