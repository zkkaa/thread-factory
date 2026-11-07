import { describe, expect, it } from 'vitest';
import {
  bufferFlash,
  describeBuffer,
  layoutSlots,
  type SlotOptions,
} from '../bufferState';
import type { BufferSnapshot, SimEvent } from '../../engine/types';

const RECT = { x: 100, y: 200, width: 400, height: 120 };
const OPTIONS: SlotOptions = {
  padding: 14,
  gap: 8,
  maxSize: 48,
  headerHeight: 30,
  footerHeight: 34,
};

function snap(overrides: Partial<BufferSnapshot> = {}): BufferSnapshot {
  return {
    id: 'ban',
    capacity: 4,
    items: 0,
    overflows: 0,
    underflows: 0,
    totalPut: 0,
    totalTaken: 0,
    ...overrides,
  };
}

describe('layoutSlots', () => {
  it('membuat satu slot per kapasitas', () => {
    expect(layoutSlots(RECT, snap({ capacity: 5 }), OPTIONS)).toHaveLength(5);
  });

  it('barang menumpuk dari ujung kanan (sisi consumer)', () => {
    const slots = layoutSlots(RECT, snap({ items: 2 }), OPTIONS);
    expect(slots.map((s) => s.filled)).toEqual([false, false, true, true]);
  });

  it('items di luar rentang dijepit', () => {
    expect(
      layoutSlots(RECT, snap({ items: 99 }), OPTIONS).every((s) => s.filled),
    ).toBe(true);
    expect(
      layoutSlots(RECT, snap({ items: -1 }), OPTIONS).some((s) => s.filled),
    ).toBe(false);
  });

  it('semua slot berada di dalam kotak dan berurutan ke kanan', () => {
    const slots = layoutSlots(RECT, snap({ capacity: 6 }), OPTIONS);
    slots.forEach((slot, i) => {
      expect(slot.x - slot.size / 2).toBeGreaterThanOrEqual(RECT.x);
      expect(slot.x + slot.size / 2).toBeLessThanOrEqual(RECT.x + RECT.width);
      if (i > 0) expect(slot.x).toBeGreaterThan(slots[i - 1]!.x);
    });
  });

  it('ukuran slot mengecil agar muat, dan tidak melebihi maxSize', () => {
    const few = layoutSlots(RECT, snap({ capacity: 2 }), OPTIONS)[0]!;
    const many = layoutSlots(RECT, snap({ capacity: 12 }), OPTIONS)[0]!;
    expect(few.size).toBe(OPTIONS.maxSize);
    expect(many.size).toBeLessThan(OPTIONS.maxSize);
  });

  it('kapasitas 0 menghasilkan daftar kosong', () => {
    expect(layoutSlots(RECT, snap({ capacity: 0 }), OPTIONS)).toEqual([]);
  });
});

describe('describeBuffer', () => {
  it('menyebut status dengan teks', () => {
    expect(describeBuffer(snap({ items: 0 })).header).toContain('KOSONG');
    expect(describeBuffer(snap({ items: 2 })).header).toContain('TERISI');
    expect(describeBuffer(snap({ items: 4 })).header).toContain('PENUH');
  });

  it('menandai masalah bila ada overflow atau underflow', () => {
    expect(describeBuffer(snap()).hasProblem).toBe(false);
    expect(describeBuffer(snap({ overflows: 1 })).hasProblem).toBe(true);
    expect(describeBuffer(snap({ underflows: 2 })).stats).toContain(
      'Underflow: 2',
    );
  });
});

describe('bufferFlash', () => {
  const events: SimEvent[] = [
    { type: 'BUFFER_PUT', tick: 1, thread: 'P', buffer: 'ban', items: 1 },
    {
      type: 'BUFFER_OVERFLOW',
      tick: 2,
      thread: 'P',
      buffer: 'ban',
      capacity: 4,
    },
    { type: 'BUFFER_UNDERFLOW', tick: 2, thread: 'C', buffer: 'lain' },
  ];

  it('hanya menghitung event untuk ban yang diminta', () => {
    expect(bufferFlash(events, 'ban')).toEqual({
      put: true,
      taken: false,
      overflow: true,
      underflow: false,
    });
    expect(bufferFlash(events, 'lain').underflow).toBe(true);
  });

  it('daftar kosong tidak menghasilkan apa pun', () => {
    expect(Object.values(bufferFlash([], 'ban')).some(Boolean)).toBe(false);
  });
});
