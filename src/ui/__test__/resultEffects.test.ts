import { describe, expect, it } from 'vitest';
import { confettiPieces, resultEffects } from '../resultEffects';

describe('resultEffects', () => {
  it('menang: konfeti dan kilau', () => {
    expect(resultEffects(true, false)).toEqual({
      confetti: true,
      sparkles: true,
      shake: false,
      vignette: false,
    });
  });

  it('kalah: getar dan tepi kemerahan', () => {
    expect(resultEffects(false, false)).toEqual({
      confetti: false,
      sparkles: false,
      shake: true,
      vignette: true,
    });
  });

  it('kurangi animasi mematikan semuanya', () => {
    for (const ok of [true, false]) {
      expect(Object.values(resultEffects(ok, true)).every((v) => !v)).toBe(
        true,
      );
    }
  });
});

describe('confettiPieces', () => {
  it('jumlah sesuai dan deterministik', () => {
    expect(confettiPieces(10)).toHaveLength(10);
    expect(confettiPieces(24)).toEqual(confettiPieces(24));
  });

  it('posisi di dalam layar dan waktu tidak negatif', () => {
    for (const p of confettiPieces()) {
      expect(p.left).toBeGreaterThanOrEqual(0);
      expect(p.left).toBeLessThanOrEqual(100);
      expect(p.delay).toBeGreaterThanOrEqual(0);
      expect(p.duration).toBeGreaterThan(0);
    }
  });
});
