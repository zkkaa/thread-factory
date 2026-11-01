import { describe, expect, it } from 'vitest';
import { MODULES } from '../../levels/modules';
import {
  type LevelMapLayout,
  layoutFor,
  validateLevelMapLayout,
} from '../levelMapLayout';

describe('LEVEL_MAP_LAYOUTS', () => {
  it.each(MODULES.map((moduleDef) => [moduleDef.id, moduleDef] as const))(
    'modul %i punya layout yang sah',
    (_id, moduleDef) => {
      const layout = layoutFor(moduleDef.id);
      expect(layout).not.toBeNull();
      if (layout === null) return;
      expect(validateLevelMapLayout(layout, moduleDef.levelIds)).toEqual([]);
    },
  );

  it('modul tak dikenal tidak punya layout', () => {
    expect(layoutFor(99)).toBeNull();
  });
});

describe('validateLevelMapLayout', () => {
  const dasar: LevelMapLayout = {
    mapImage: 'peta.jpg',
    padWidth: 10,
    pads: { a: { x: 10, y: 10 }, b: { x: 50, y: 50 } },
    via: [[{ x: 30, y: 20 }]],
    robot: { x: 20, y: 60, width: 6 },
  };

  it('layout benar tidak punya masalah', () => {
    expect(validateLevelMapLayout(dasar, ['a', 'b'])).toEqual([]);
  });

  it('melaporkan titik hilang, titik asing, via salah, dan koordinat di luar batas', () => {
    const rusak: LevelMapLayout = {
      ...dasar,
      pads: { a: { x: 10, y: 130 }, z: { x: 1, y: 1 } },
      via: [],
    };
    const masalah = validateLevelMapLayout(rusak, ['a', 'b']);
    expect(masalah).toContain('level b belum punya titik');
    expect(masalah).toContain('titik a di luar 0..100');
    expect(masalah).toContain('titik z bukan level modul');
    expect(masalah).toContain('via harus 1 ruas, ada 0');
  });

  it('melaporkan robot di luar batas atau tanpa lebar', () => {
    const masalah = validateLevelMapLayout(
      { ...dasar, robot: { x: 120, y: 60, width: 0 } },
      ['a', 'b'],
    );
    expect(masalah).toContain('lebar robot harus positif');
    expect(masalah).toContain('robot di luar 0..100');
  });
});
