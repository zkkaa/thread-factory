import { describe, expect, it } from 'vitest';
import { layout1_1 } from '../layouts/level-1-1.layout';
import { pointAt, sampleClosedPath } from '../pathMath';
import { clientToGame, nearestSlot, slotPositions } from '../slots';

const positions = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 200, y: 0 },
];

describe('nearestSlot', () => {
  it('memilih slot terdekat dalam jangkauan', () => {
    expect(nearestSlot({ x: 90, y: 10 }, positions, 50)).toBe(1);
  });

  it('null bila semua slot di luar jangkauan', () => {
    expect(nearestSlot({ x: 100, y: 200 }, positions, 50)).toBeNull();
  });

  it('hanya mempertimbangkan slot yang diizinkan', () => {
    const allowed = new Set([2]);
    expect(nearestSlot({ x: 10, y: 0 }, positions, 500, allowed)).toBe(2);
  });

  it('null bila slot terdekat tidak diizinkan dan sisanya terlalu jauh', () => {
    expect(nearestSlot({ x: 0, y: 0 }, positions, 50, new Set([2]))).toBeNull();
  });

  it('jarak sama: indeks lebih kecil menang', () => {
    expect(nearestSlot({ x: 50, y: 0 }, positions, 100)).toBe(0);
  });

  it('daftar kosong menghasilkan null', () => {
    expect(nearestSlot({ x: 0, y: 0 }, [], 100)).toBeNull();
  });
});

describe('slotPositions', () => {
  it('satu titik per slot, sama dengan pointAt di jalan layout', () => {
    const path = sampleClosedPath(layout1_1.path);
    const result = slotPositions(path, layout1_1.slots);
    expect(result).toHaveLength(layout1_1.slots.length);
    const first = pointAt(path, layout1_1.slots[0] ?? 0, 0);
    expect(result[0]).toEqual({ x: first.x, y: first.y });
  });
});

describe('clientToGame', () => {
  const arena = { width: 1280, height: 720 };

  it('kanvas tanpa skala dan geseran: koordinat sama', () => {
    const rect = { left: 0, top: 0, width: 1280, height: 720 };
    expect(clientToGame(300, 200, rect, arena)).toEqual({ x: 300, y: 200 });
  });

  it('kanvas diskalakan 0.5 dan bergeser: kembali ke koordinat game', () => {
    const rect = { left: 100, top: 50, width: 640, height: 360 };
    expect(clientToGame(420, 230, rect, arena)).toEqual({ x: 640, y: 360 });
  });

  it('kanvas berukuran nol: NaN, tidak mengenai slot mana pun', () => {
    const rect = { left: 0, top: 0, width: 0, height: 0 };
    const point = clientToGame(10, 10, rect, arena);
    expect(Number.isNaN(point.x)).toBe(true);
    expect(nearestSlot(point, positions, 1000)).toBeNull();
  });
});
