import { describe, expect, it } from 'vitest';
import { forwardEnd, pointAt, sampleClosedPath } from '../pathMath';

// Belah ketupat searah jarum jam pada layar (y ke bawah).
const DIAMOND = [
  { x: 100, y: 0 },
  { x: 0, y: 100 },
  { x: -100, y: 0 },
  { x: 0, y: -100 },
];

describe('sampleClosedPath', () => {
  it('panjang positif, kumulatif menaik, dan ujungnya sama dengan panjang', () => {
    const path = sampleClosedPath(DIAMOND);
    expect(path.length).toBeGreaterThan(0);
    expect(path.cumulative[path.cumulative.length - 1]).toBe(path.length);
    for (let i = 1; i < path.cumulative.length; i++) {
      expect(path.cumulative[i]).toBeGreaterThanOrEqual(
        path.cumulative[i - 1] ?? 0,
      );
    }
  });

  it('menolak kurang dari 3 titik', () => {
    expect(() => sampleClosedPath(DIAMOND.slice(0, 2))).toThrow();
  });
});

describe('pointAt', () => {
  const path = sampleClosedPath(DIAMOND);

  it('pecahan 0 di titik kontrol pertama, 0.5 di titik kontrol ke-3', () => {
    const start = pointAt(path, 0);
    expect(start.x).toBeCloseTo(100, 5);
    expect(start.y).toBeCloseTo(0, 5);
    const half = pointAt(path, 0.5);
    expect(Math.abs(half.x + 100)).toBeLessThan(1);
    expect(Math.abs(half.y)).toBeLessThan(1);
  });

  it('pecahan 1 sama dengan 0 (satu putaran utuh)', () => {
    const a = pointAt(path, 0);
    const b = pointAt(path, 1);
    expect(b.x).toBeCloseTo(a.x, 5);
    expect(b.y).toBeCloseTo(a.y, 5);
  });

  it('offset menggeser sejauh |offset| dan positif ke sisi dalam', () => {
    const base = pointAt(path, 0.3, 0);
    const inner = pointAt(path, 0.3, 10);
    expect(Math.hypot(inner.x - base.x, inner.y - base.y)).toBeCloseTo(10, 5);
    expect(Math.hypot(inner.x, inner.y)).toBeLessThan(
      Math.hypot(base.x, base.y),
    );
  });
});

describe('forwardEnd', () => {
  it('maju biasa bila target di depan', () => {
    expect(forwardEnd(0.2, 0.5)).toBe(0.5);
  });
  it('melewati ujung jalan bila target di belakang', () => {
    expect(forwardEnd(0.93, 0.12)).toBeCloseTo(1.12, 10);
  });
  it('tidak bergerak bila sama', () => {
    expect(forwardEnd(0.4, 0.4)).toBe(0.4);
  });
});
