import { describe, it, expect } from 'vitest';
import { parseSeed } from '../parseSeed';

describe('parseSeed', () => {
  it('menerima bilangan bulat tak negatif (spasi di tepi diabaikan)', () => {
    expect(parseSeed('10')).toBe(10);
    expect(parseSeed('  0 ')).toBe(0);
    expect(parseSeed('007')).toBe(7);
  });

  it('menolak isian kosong, pecahan, negatif, huruf, dan notasi ilmiah', () => {
    for (const text of ['', '   ', '1.5', '-3', 'abc', '1e3', '10x', '0x10']) {
      expect(parseSeed(text)).toBeNull();
    }
  });

  it('menolak bilangan yang terlalu besar untuk diwakili dengan tepat', () => {
    expect(parseSeed('99999999999999999999')).toBeNull();
  });
});
