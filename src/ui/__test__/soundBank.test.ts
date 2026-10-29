import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MUSIC_PATH, SOUND_PATHS } from '../audio/soundBank';

const publicUrl = (path: string) =>
  new URL(`../../../public/${path}`, import.meta.url);

const entries = Object.entries(SOUND_PATHS);

describe('berkas audio', () => {
  it('semua efek dan musik ada, berformat Ogg, dan tidak kosong', () => {
    for (const [name, path] of [...entries, ['musik', MUSIC_PATH]] as const) {
      expect(existsSync(publicUrl(path)), name).toBe(true);
      const bytes = readFileSync(publicUrl(path));
      expect(bytes.length, name).toBeGreaterThan(1000);
      expect(bytes.subarray(0, 4).toString('latin1'), name).toBe('OggS');
    }
  });

  it('tiap efek suara punya isi berbeda (bukan satu bunyi yang disalin)', () => {
    const hashes = entries.map(([, path]) =>
      createHash('md5')
        .update(readFileSync(publicUrl(path)))
        .digest('hex'),
    );
    expect(new Set(hashes).size, 'ada efek suara yang isinya identik').toBe(
      hashes.length,
    );
  });
});
