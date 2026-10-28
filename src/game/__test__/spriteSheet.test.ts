import { describe, expect, it } from 'vitest';
import {
  frameCount,
  frameRect,
  scaledFrameSize,
  type SheetSpec,
} from '../spriteSheet';

const SPEC: SheetSpec = {
  key: 'k',
  sourceKey: 's',
  path: 'p.png',
  frameSize: 16,
  columns: 12,
  rows: 11,
  scale: 4,
};

describe('spriteSheet', () => {
  it('menghitung jumlah frame dan ukuran frame terskala', () => {
    expect(frameCount(SPEC)).toBe(132);
    expect(scaledFrameSize(SPEC)).toBe(64);
  });

  it('frame 0 di pojok kiri atas', () => {
    expect(frameRect(SPEC, 0)).toEqual({ x: 0, y: 0, width: 64, height: 64 });
  });

  it('frame dihitung baris demi baris (frame 13 = kolom 1, baris 1)', () => {
    expect(frameRect(SPEC, 13)).toEqual({
      x: 64,
      y: 64,
      width: 64,
      height: 64,
    });
  });

  it('frame terakhir di pojok kanan bawah', () => {
    expect(frameRect(SPEC, 131)).toEqual({
      x: 11 * 64,
      y: 10 * 64,
      width: 64,
      height: 64,
    });
  });

  it('menolak nomor frame di luar rentang atau bukan bilangan bulat', () => {
    expect(() => frameRect(SPEC, -1)).toThrow(RangeError);
    expect(() => frameRect(SPEC, 132)).toThrow(RangeError);
    expect(() => frameRect(SPEC, 1.5)).toThrow(RangeError);
  });
});
