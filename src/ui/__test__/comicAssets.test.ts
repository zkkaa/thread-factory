import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  COMIC_REQUIRED_PATHS,
  levelThumbPath,
  levelThumbUrl,
  panelTilt,
} from '../comicAssets';

const LEVEL_IDS = [
  '1-1', '1-2', '1-3', '1-4', '1-5',
  '2-1', '2-2', '2-3', '2-4',
];

const publicAsset = (path: string) =>
  resolve(process.cwd(), 'public', 'assets', path);

describe('comicAssets', () => {
  it('membentuk URL thumbnail dari id level', () => {
    expect(levelThumbUrl('1-1')).toContain('ui/komik/level/level-1-1.jpg');
  });

  it('kemiringan panel berulang dan aman untuk indeks negatif', () => {
    expect(panelTilt(0)).not.toBe('');
    expect(panelTilt(5)).toBe(panelTilt(0));
    expect(panelTilt(-1)).toBe(panelTilt(4));
  });

  it('semua aset komik yang dipakai kode ada di public/assets', () => {
    const missing = COMIC_REQUIRED_PATHS.filter((p) => !existsSync(publicAsset(p)));
    expect(missing).toEqual([]);
  });

  it('thumbnail tiap level ada', () => {
    const missing = LEVEL_IDS.map(levelThumbPath).filter(
      (p) => !existsSync(publicAsset(p)),
    );
    expect(missing).toEqual([]);
  });
});