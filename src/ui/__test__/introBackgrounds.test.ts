import { describe, expect, it } from 'vitest';
import {
  DEFAULT_INTRO_BACKGROUND,
  INTRO_BACKGROUNDS,
  introBackgroundFor,
} from '../introBackgrounds';

describe('introBackgroundFor', () => {
  it('memakai latar khusus bila level punya entri', () => {
    expect(introBackgroundFor('1-1')).toBe(INTRO_BACKGROUNDS['1-1']);
  });

  it('jatuh ke latar arena umum untuk level tanpa entri', () => {
    expect(introBackgroundFor('1-2')).toBe(DEFAULT_INTRO_BACKGROUND);
    expect(introBackgroundFor('2-1')).toBe(DEFAULT_INTRO_BACKGROUND);
    expect(introBackgroundFor('level-tidak-ada')).toBe(
      DEFAULT_INTRO_BACKGROUND,
    );
  });

  it('tidak pernah mengembalikan string kosong', () => {
    expect(introBackgroundFor('').length).toBeGreaterThan(0);
  });
});
