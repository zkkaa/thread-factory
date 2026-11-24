import { describe, expect, it } from 'vitest';
import { barFractions } from '../compareChart';

describe('barFractions', () => {
  it('batang terpanjang bernilai 1 dan yang lain sebanding', () => {
    expect(barFractions(10, 5)).toEqual({ a: 1, b: 0.5 });
    expect(barFractions(5, 10)).toEqual({ a: 0.5, b: 1 });
  });

  it('nilai sama menghasilkan dua batang penuh', () => {
    expect(barFractions(7, 7)).toEqual({ a: 1, b: 1 });
  });

  it('kedua nol menghasilkan batang kosong', () => {
    expect(barFractions(0, 0)).toEqual({ a: 0, b: 0 });
  });

  it('satu sisi nol tetap kosong sementara sisi lain penuh', () => {
    expect(barFractions(0, 4)).toEqual({ a: 0, b: 1 });
  });

  it('nilai kecil tetap terlihat (minimal 2 persen)', () => {
    const { a, b } = barFractions(1, 1000);
    expect(b).toBe(1);
    expect(a).toBeGreaterThanOrEqual(0.02);
  });

  it('nilai negatif atau tidak valid dianggap nol', () => {
    expect(barFractions(-3, 6)).toEqual({ a: 0, b: 1 });
    expect(barFractions(Number.NaN, 6)).toEqual({ a: 0, b: 1 });
    expect(barFractions(Infinity, Infinity)).toEqual({ a: 0, b: 0 });
  });
});
