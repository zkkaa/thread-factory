import { describe, expect, it } from 'vitest';
import { pulseClass, starClass } from '../motion';

describe('pulseClass', () => {
  it('berdenyut hanya bila aktif dan animasi tidak dikurangi', () => {
    expect(pulseClass(true, false)).toContain('animate-pulse');
  });

  it('kosong bila tidak aktif atau animasi dikurangi', () => {
    expect(pulseClass(false, false)).toBe('');
    expect(pulseClass(true, true)).toBe('');
  });
});

describe('starClass', () => {
  it('hanya bintang yang baru muncul yang beranimasi', () => {
    expect(starClass(1, 2, false)).toContain('animate-star-pop');
    expect(starClass(0, 2, false)).not.toContain('animate-star-pop');
    expect(starClass(2, 2, false)).not.toContain('animate-star-pop');
  });

  it('belum ada bintang tampil: tidak ada animasi', () => {
    for (const i of [0, 1, 2]) {
      expect(starClass(i, 0, false)).not.toContain('animate-star-pop');
    }
  });

  it('kurangi animasi: tidak ada animasi sama sekali', () => {
    for (const i of [0, 1, 2]) {
      expect(starClass(i, 3, true)).not.toContain('animate-star-pop');
    }
  });
});
