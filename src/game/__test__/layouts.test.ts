import { describe, expect, it } from 'vitest';
import { MODULES, findLevelById } from '../../levels';
import { level1_1 } from '../../levels/module1/level-1-1';
import { getLayout } from '../layouts';
import { layout1_1 } from '../layouts/level-1-1.layout';
import { validateLayout } from '../layouts/validate';

describe('validateLayout', () => {
  it('layout 1-1 sah terhadap level 1-1', () => {
    expect(validateLayout(layout1_1, level1_1)).toEqual([]);
  });

  it('menolak jumlah slot yang salah', () => {
    const bad = { ...layout1_1, slots: [0.04, 0.235, 0.475, 0.725] };
    expect(validateLayout(bad, level1_1)).toContain('slot 4, seharusnya 5');
  });

  it('menolak fraksi checkpoint yang tidak menaik', () => {
    const bad = { ...layout1_1, checkpoints: [0.12, 0.6, 0.35, 0.85] };
    expect(validateLayout(bad, level1_1)).toContain(
      'fraksi checkpoint harus menaik',
    );
  });

  it('menolak koordinat di luar ARENA', () => {
    const bad = {
      ...layout1_1,
      path: [...layout1_1.path, { x: 5000, y: 10 }],
    };
    expect(validateLayout(bad, level1_1)).toContain(
      'titik jalan di luar ARENA',
    );
  });

  it('menolak slot yang tidak berada di antara checkpoint', () => {
    const bad = { ...layout1_1, slots: [0.04, 0.1, 0.475, 0.725, 0.93] };
    expect(validateLayout(bad, level1_1).length).toBeGreaterThan(0);
  });
});

describe('registri layout', () => {
  it('setiap level yang sudah ada punya layoutId terdaftar dan sah', () => {
    const levels = MODULES.flatMap((m) => m.levelIds)
      .map((id) => findLevelById(id))
      .filter((level) => level !== undefined);
    expect(levels.length).toBeGreaterThan(0);
    for (const level of levels) {
      const layout = getLayout(level.layoutId);
      expect(layout, `layout ${level.layoutId}`).toBeDefined();
      if (layout !== undefined) {
        expect(validateLayout(layout, level)).toEqual([]);
      }
    }
  });
});
