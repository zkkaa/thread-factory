import { describe, it, expect } from 'vitest';
import { createPrng, normalizeSeed } from '../prng';

function take(seed: number, count: number): number[] {
  const prng = createPrng(seed);
  return Array.from({ length: count }, () => prng.next());
}

describe('createPrng: determinisme', () => {
  it('seed yang sama menghasilkan urutan yang sama persis', () => {
    expect(take(12345, 200)).toEqual(take(12345, 200));
  });

  it('seed berbeda menghasilkan urutan berbeda', () => {
    expect(take(1, 20)).not.toEqual(take(2, 20));
  });

  it('dua instance dengan seed sama tidak saling memengaruhi', () => {
    const a = createPrng(7);
    const b = createPrng(7);
    a.next();
    a.next();
    // b belum dipanggil sama sekali; harus tetap mulai dari awal urutan
    expect(b.next()).toBe(take(7, 1)[0]);
  });

  it('nilai referensi (golden) tidak berubah: mendeteksi perubahan algoritma tanpa sengaja', () => {
    expect(take(1, 5)).toEqual([
      0.6270739405881613, 0.002735721180215478, 0.5274470399599522,
      0.9810509674716741, 0.9683778982143849,
    ]);
    expect(take(42, 5)).toEqual([
      0.6011037519201636, 0.44829055899754167, 0.8524657934904099,
      0.6697340414393693, 0.17481389874592423,
    ]);
  });
});

describe('createPrng: next()', () => {
  it('selalu berada di rentang [0, 1)', () => {
    for (const value of take(99, 5000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('seed 0 dan seed negatif tetap bekerja', () => {
    expect(take(0, 5)).toHaveLength(5);
    expect(take(-5, 5)).toHaveLength(5);
  });
});

describe('createPrng: nextInt()', () => {
  it('selalu menghasilkan bilangan bulat di [0, max)', () => {
    const prng = createPrng(2024);
    for (let i = 0; i < 2000; i++) {
      const value = prng.nextInt(6);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(6);
    }
  });

  it('semua nilai di rentang pernah muncul (tidak bias ke sebagian saja)', () => {
    const prng = createPrng(2024);
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) seen.add(prng.nextInt(6));
    expect([...seen].sort()).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('max = 1 selalu menghasilkan 0', () => {
    const prng = createPrng(5);
    for (let i = 0; i < 50; i++) expect(prng.nextInt(1)).toBe(0);
  });

  it('menolak argumen tidak valid', () => {
    const prng = createPrng(1);
    expect(() => prng.nextInt(0)).toThrow(RangeError);
    expect(() => prng.nextInt(-3)).toThrow(RangeError);
    expect(() => prng.nextInt(2.5)).toThrow(RangeError);
    expect(() => prng.nextInt(Number.NaN)).toThrow(RangeError);
  });
});

describe('createPrng: pick()', () => {
  it('memilih elemen dari array', () => {
    const prng = createPrng(3);
    const items = ['a', 'b', 'c'] as const;
    for (let i = 0; i < 100; i++) expect(items).toContain(prng.pick(items));
  });

  it('deterministik: seed sama memilih urutan yang sama', () => {
    const items = [10, 20, 30, 40];
    const a = createPrng(8);
    const b = createPrng(8);
    const picksA = Array.from({ length: 30 }, () => a.pick(items));
    const picksB = Array.from({ length: 30 }, () => b.pick(items));
    expect(picksA).toEqual(picksB);
  });

  it('menolak array kosong', () => {
    expect(() => createPrng(1).pick([])).toThrow(RangeError);
  });
});

describe('normalizeSeed', () => {
  it('membulatkan pecahan ke bawah', () => {
    expect(normalizeSeed(7.9)).toBe(7);
  });

  it('mengubah seed negatif menjadi bilangan 32-bit tanpa tanda', () => {
    expect(normalizeSeed(-1)).toBe(4294967295);
  });

  it('menolak NaN dan Infinity', () => {
    expect(() => normalizeSeed(Number.NaN)).toThrow(RangeError);
    expect(() => normalizeSeed(Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => createPrng(Number.NaN)).toThrow(RangeError);
  });
});
