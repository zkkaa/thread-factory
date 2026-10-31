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
    const bad = { ...layout1_1, slots: [0.04, 0.265, 0.445, 0.765] };
    expect(validateLayout(bad, level1_1)).toContain('slot 4, seharusnya 5');
  });

  it('menolak fraksi checkpoint yang tidak menaik', () => {
    const bad = { ...layout1_1, checkpoints: [0.105, 0.605, 0.355, 0.855] };
    expect(validateLayout(bad, level1_1)).toContain(
      'fraksi checkpoint harus menaik',
    );
  });

  it('menolak jalan di luar ARENA', () => {
    const bad = { ...layout1_1, road: { ...layout1_1.road, left: 1200 } };
    expect(validateLayout(bad, level1_1)).toContain('jalan di luar ARENA');
  });

  it('menolak ukuran jalan bukan kelipatan satuan ubin', () => {
    const bad = { ...layout1_1, road: { ...layout1_1.road, width: 770 } };
    expect(validateLayout(bad, level1_1).length).toBeGreaterThan(0);
  });

  it('menolak papan di luar lubang tengah jalan', () => {
    const bad = { ...layout1_1, board: { ...layout1_1.board, x: 300 } };
    expect(validateLayout(bad, level1_1)).toContain(
      'papan harus berada di lubang tengah jalan',
    );
  });

  it('menolak slot yang tidak berada di antara checkpoint', () => {
    const bad = { ...layout1_1, slots: [0.04, 0.1, 0.445, 0.765, 0.945] };
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
