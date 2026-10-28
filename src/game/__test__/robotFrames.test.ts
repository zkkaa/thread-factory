import { describe, expect, it } from 'vitest';
import { ROBOT_FRAMES, TINY_FACTORY, robotFrameFor } from '../assetManifest';
import { frameCount } from '../spriteSheet';

describe('robotFrameFor', () => {
  it('empat robot pertama memakai frame yang berbeda', () => {
    const frames = [0, 1, 2, 3].map((index) => robotFrameFor(index));
    expect(new Set(frames).size).toBe(4);
  });

  it('berulang bila robot lebih banyak dari frame (Level 1-3: 8 robot)', () => {
    expect(robotFrameFor(4)).toBe(robotFrameFor(0));
    expect(robotFrameFor(7)).toBe(robotFrameFor(3));
  });

  it('semua frame robot ada di dalam spritesheet', () => {
    for (const frame of ROBOT_FRAMES) {
      expect(Number.isInteger(frame)).toBe(true);
      expect(frame).toBeGreaterThanOrEqual(0);
      expect(frame).toBeLessThan(frameCount(TINY_FACTORY));
    }
  });

  it('indeks negatif tetap menghasilkan frame yang valid', () => {
    expect(ROBOT_FRAMES).toContain(robotFrameFor(-1));
  });
});
