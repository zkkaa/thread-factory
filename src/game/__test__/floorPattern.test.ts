import { describe, expect, it } from 'vitest';
import { TINY_FRAMES } from '../assetManifest';
import { floorFrameAt } from '../floorPattern';

describe('floorFrameAt', () => {
  it('deterministik: ubin yang sama selalu memberi frame yang sama', () => {
    expect(floorFrameAt(3, 4)).toBe(floorFrameAt(3, 4));
    expect(floorFrameAt(0, 0)).toBe(floorFrameAt(0, 0));
  });

  it('hanya mengembalikan frame lantai dasar atau berserpihan', () => {
    const allowed = new Set<number>([
      TINY_FRAMES.floorBase,
      TINY_FRAMES.floorDebris,
    ]);
    for (let row = 0; row < 12; row++) {
      for (let col = 0; col < 20; col++) {
        expect(allowed.has(floorFrameAt(col, row))).toBe(true);
      }
    }
  });

  it('variasi berserpihan jarang (sekitar 10 sampai 25 persen) pada arena 20x12', () => {
    let debris = 0;
    for (let row = 0; row < 12; row++) {
      for (let col = 0; col < 20; col++) {
        if (floorFrameAt(col, row) === TINY_FRAMES.floorDebris) debris++;
      }
    }
    expect(debris / 240).toBeGreaterThan(0.1);
    expect(debris / 240).toBeLessThan(0.25);
  });
});
