import { describe, expect, it } from 'vitest';
import { level2_3 } from '../../levels/module2/level-2-3';
import { getLayout } from '../layouts';
import { layout2_3 } from '../layouts/level-2-3.layout';
import { validateLayout } from '../layouts/validate';

describe('layout meja Level 2-3 (T-101)', () => {
  it('sah terhadap level', () => {
    expect(validateLayout(layout2_3, level2_3)).toEqual([]);
  });

  it('terdaftar di registri layout', () => {
    expect(getLayout(level2_3.layoutId)).toBe(layout2_3);
  });

  it('teknisi yang terlalu rapat ditolak', () => {
    const seats = layout2_3.seats.map((p) => ({ ...p }));
    seats[1] = { ...(seats[0] ?? { x: 0, y: 0 }) };
    const errors = validateLayout({ ...layout2_3, seats }, level2_3);
    expect(errors.some((e) => e.includes('teknisi terlalu rapat'))).toBe(true);
  });

  it('teknisi di luar area aman HUD ditolak', () => {
    const seats = layout2_3.seats.map((p) => ({ ...p }));
    seats[0] = { x: 10, y: 10 };
    const errors = validateLayout({ ...layout2_3, seats }, level2_3);
    expect(errors.some((e) => e.includes('area aman HUD'))).toBe(true);
  });

  it('seatIds yang tidak cocok dengan thread level ditolak', () => {
    const errors = validateLayout(
      { ...layout2_3, seatIds: ['T1', 'T2', 'T3', 'T4', 'X'] },
      level2_3,
    );
    expect(errors.some((e) => e.includes('seatIds'))).toBe(true);
  });
});