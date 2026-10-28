import { describe, expect, it } from 'vitest';
import { TINY_FACTORY } from '../assetManifest';
import { iconFrameFor } from '../opIcons';
import { frameCount } from '../spriteSheet';

describe('iconFrameFor', () => {
  it('instruksi Level 1-1 punya ikon', () => {
    for (const op of ['WORK', 'READ', 'COMPUTE', 'WRITE'] as const) {
      expect(iconFrameFor(op), op).not.toBeNull();
    }
  });

  it('READ dan WRITE berbagi ikon pertukaran data', () => {
    expect(iconFrameFor('READ')).toBe(iconFrameFor('WRITE'));
  });

  it('instruksi pengaman tidak punya ikon (sudah ada gerbang)', () => {
    for (const op of ['LOCK', 'UNLOCK', 'SEM_WAIT', 'SEM_SIGNAL'] as const) {
      expect(iconFrameFor(op), op).toBeNull();
    }
  });

  it('frame yang dikembalikan ada di dalam spritesheet', () => {
    for (const op of ['WORK', 'READ', 'COMPUTE', 'WRITE'] as const) {
      const frame = iconFrameFor(op);
      expect(frame).not.toBeNull();
      expect(frame).toBeLessThan(frameCount(TINY_FACTORY));
    }
  });
});
