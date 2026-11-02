import { describe, expect, it } from 'vitest';
import {
  clickSlot,
  slotCount,
  spanFromSlots,
  validExitSlots,
} from '../doorSlots';

describe('slot bebas untuk Level 1-2 (T-037)', () => {
  const total = slotCount(4); // 5 slot: 0..4

  it('slot 0 (sebelum WORK) boleh jadi pintu masuk', () => {
    const first = clickSlot({ phase: 'idle' }, 0, total);
    expect(first.state).toEqual({ phase: 'entry', entry: 0 });
  });

  it('pintu 0..4 menghasilkan span start 0 dan end 3', () => {
    const first = clickSlot({ phase: 'idle' }, 0, total);
    const second = clickSlot(first.state, 4, total);
    expect(second.door).toEqual({ entry: 0, exit: 4 });
    expect(spanFromSlots({ entry: 0, exit: 4 })).toEqual({ start: 0, end: 3 });
  });

  it('dari slot masuk 0, slot keluar yang sah adalah 1 sampai 4', () => {
    expect(validExitSlots(0, 4)).toEqual([1, 2, 3, 4]);
  });
});
