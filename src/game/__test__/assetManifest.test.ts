import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  EXTRA_FILES,
  SHEETS,
  TINY_FACTORY,
  TINY_FRAMES,
} from '../assetManifest';
import { frameCount, scaledFrameSize } from '../spriteSheet';
import { TILE_SIZE } from '../theme';

const assetUrl = (path: string) =>
  new URL(`../../../public/assets/${path}`, import.meta.url);

describe('assetManifest', () => {
  it('semua spritesheet dan berkas pendukung ada di public/assets', () => {
    for (const sheet of SHEETS) {
      expect(existsSync(assetUrl(sheet.path)), sheet.path).toBe(true);
    }
    for (const path of EXTRA_FILES) {
      expect(existsSync(assetUrl(path)), path).toBe(true);
    }
  });

  it('berkas PNG valid dan ukurannya cocok dengan kolom x baris x ukuran frame', () => {
    for (const sheet of SHEETS) {
      const bytes = readFileSync(assetUrl(sheet.path));
      // Tanda tangan PNG, lalu lebar dan tinggi dari kepala IHDR (byte 16 dan 20).
      expect(bytes.subarray(1, 4).toString('latin1'), sheet.path).toBe('PNG');
      expect(bytes.readUInt32BE(16), `${sheet.path} lebar`).toBe(
        sheet.columns * sheet.frameSize,
      );
      expect(bytes.readUInt32BE(20), `${sheet.path} tinggi`).toBe(
        sheet.rows * sheet.frameSize,
      );
    }
  });

  it('ukuran frame terskala sama dengan TILE_SIZE di theme.ts', () => {
    expect(scaledFrameSize(TINY_FACTORY)).toBe(TILE_SIZE);
  });

  it('kunci tekstur unik dan skala berupa bilangan bulat positif', () => {
    const keys = SHEETS.flatMap((sheet) => [sheet.key, sheet.sourceKey]);
    expect(new Set(keys).size).toBe(keys.length);
    for (const sheet of SHEETS) {
      expect(Number.isInteger(sheet.scale) && sheet.scale > 0).toBe(true);
    }
  });

  it('nomor frame yang dipakai berada dalam rentang spritesheet', () => {
    for (const frame of Object.values(TINY_FRAMES)) {
      expect(frame).toBeGreaterThanOrEqual(0);
      expect(frame).toBeLessThan(frameCount(TINY_FACTORY));
    }
  });
});
