import { describe, it, expect } from 'vitest';
import { ALL_LEVELS, findLevelById, level1_1 } from '../index';

describe('Daftar level', () => {
  it('id level unik', () => {
    const ids = ALL_LEVELS.map((level) => level.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('findLevelById menemukan level 1-1', () => {
    expect(findLevelById('1-1')).toBe(level1_1);
    expect(findLevelById('tidak-ada')).toBeUndefined();
  });
});

// Aturan konten wajib tiap level: PRD bagian 9 ("Konten wajib setiap level").
for (const level of ALL_LEVELS) {
  describe(`Data level ${level.id}`, () => {
    it('intro terdiri dari 2 sampai 3 halaman berisi teks', () => {
      expect(level.intro.length).toBeGreaterThanOrEqual(2);
      expect(level.intro.length).toBeLessThanOrEqual(3);
      for (const page of level.intro) {
        expect(page.text.trim().length).toBeGreaterThan(0);
      }
    });

    it('punya minimal 3 petunjuk bertahap yang tidak kosong', () => {
      expect(level.hints.length).toBeGreaterThanOrEqual(3);
      for (const hint of level.hints) {
        expect(hint.trim().length).toBeGreaterThan(0);
      }
    });

    it('punya daftar konsep yang dipelajari', () => {
      expect(level.concepts.length).toBeGreaterThanOrEqual(1);
    });

    it('punya penjelasan saat lulus dan saat gagal', () => {
      expect(level.explanation?.pass.trim().length).toBeGreaterThan(0);
      expect(level.explanation?.fail.trim().length).toBeGreaterThan(0);
    });

    it('layoutId terisi', () => {
      expect(level.layoutId.trim().length).toBeGreaterThan(0);
    });
  });
}
