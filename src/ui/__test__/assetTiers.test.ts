import { existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { NOT_PRELOADED, TIER_BACKGROUND, TIER_BOOT } from '../assetTiers';

const ASSET_ROOT = resolve(process.cwd(), 'public', 'assets');
const IMAGE = /\.(png|jpe?g|webp)$/i;
const BOOT_BUDGET_BYTES = 1.5 * 1024 * 1024;

function listImages(folder: string): string[] {
  return readdirSync(resolve(ASSET_ROOT, folder), {
    recursive: true,
    encoding: 'utf8',
  })
    .filter((name) => IMAGE.test(name))
    .map((name) => `${folder}/${name.split(sep).join('/')}`);
}

const listed = [...TIER_BOOT, ...TIER_BACKGROUND, ...NOT_PRELOADED];

describe('assetTiers', () => {
  it('semua berkas yang didaftarkan ada di public/assets', () => {
    const missing = listed.filter((p) => !existsSync(resolve(ASSET_ROOT, p)));
    expect(missing).toEqual([]);
  });

  it('tidak ada berkas yang terdaftar dua kali', () => {
    const duplicates = listed.filter((p, i) => listed.indexOf(p) !== i);
    expect(duplicates).toEqual([]);
  });

  it('semua gambar di ui, characters, dan world sudah diklasifikasi', () => {
    const all = ['ui', 'characters', 'world'].flatMap(listImages);
    const unlisted = all.filter((p) => !listed.includes(p));
    expect(unlisted).toEqual([]);
  });

  it('tahap boot tetap kecil agar layar pertama cepat', () => {
    const total = TIER_BOOT.reduce(
      (sum, p) => sum + statSync(resolve(ASSET_ROOT, p)).size,
      0,
    );
    expect(total).toBeLessThan(BOOT_BUDGET_BYTES);
  });
});
