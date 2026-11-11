import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CHARACTERS,
  LEVEL_CHARACTERS,
  characterForLevel,
  type CharacterId,
} from '../../levels/characters';
import { LEVEL_ORDER } from '../../levels/modules';
import { portraitSourcesFor } from '../mandorPortraits';

const MOODS = ['netral', 'senang', 'sedih', 'berpikir'] as const;

describe('karakter pemandu', () => {
  it('semua berkas potret (5 karakter x 4 ekspresi) ada di public/', () => {
    for (const id of Object.keys(CHARACTERS) as CharacterId[]) {
      const sources = portraitSourcesFor(id);
      for (const mood of MOODS) {
        const path = sources[mood];
        expect(path, `${id}-${mood}`).not.toBeNull();
        if (path !== null) {
          expect(existsSync(resolve('public', path)), path).toBe(true);
        }
      }
    }
  });

  it('setiap level di urutan modul punya karakter', () => {
    for (const levelId of LEVEL_ORDER) {
      expect(LEVEL_CHARACTERS[levelId], levelId).toBeDefined();
    }
  });

  it('pembagian sesuai kesepakatan tim', () => {
    expect(characterForLevel('1-1')).toBe('aldi');
    expect(characterForLevel('1-2')).toBe('azka');
    expect(characterForLevel('1-3')).toBe('fikri');
    expect(characterForLevel('1-4')).toBe('rifal');
    expect(characterForLevel('1-5')).toBe('widad');
    expect(characterForLevel('2-1')).toBe('widad');
    expect(characterForLevel('2-2')).toBe('azka');
    expect(characterForLevel('2-3')).toBe('fikri');
    expect(characterForLevel('2-4')).toBe('rifal');
  });

  it('level tidak dikenal memakai karakter Beranda', () => {
    expect(characterForLevel('9-9')).toBe('aldi');
  });
});
