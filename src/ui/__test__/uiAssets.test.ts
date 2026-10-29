import { existsSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MANDOR_AVATAR, MANDOR_PORTRAITS } from '../mandorPortraits';
import { UI_ASSETS } from '../uiAssets';

const publicUrl = (path: string) =>
  new URL(`../../../public/${path}`, import.meta.url);

describe('aset lapisan UI', () => {
  it('logo, latar Beranda, dan avatar ada dan tidak kosong', () => {
    for (const path of [
      UI_ASSETS.logo,
      UI_ASSETS.homeBackground,
      MANDOR_AVATAR,
    ]) {
      expect(existsSync(publicUrl(path)), path).toBe(true);
      expect(statSync(publicUrl(path)).size, path).toBeGreaterThan(1000);
    }
  });

  it('keempat potret terdaftar dan berkasnya ada', () => {
    for (const [mood, path] of Object.entries(MANDOR_PORTRAITS)) {
      expect(path, mood).not.toBeNull();
      if (path !== null) expect(existsSync(publicUrl(path)), mood).toBe(true);
    }
  });
});
