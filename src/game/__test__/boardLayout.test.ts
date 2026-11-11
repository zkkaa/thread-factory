import { describe, expect, it } from 'vitest';
import { level2_2 } from '../../levels/module2/level-2-2';
import { getLayout } from '../layouts';
import { layout2_2 } from '../layouts/level-2-2.layout';
import { validateLayout } from '../layouts/validate';

describe('layout papan Level 2-2 (T-099)', () => {
  it('sah terhadap level dan terdaftar', () => {
    expect(validateLayout(layout2_2, level2_2)).toEqual([]);
    expect(getLayout(level2_2.layoutId)).toBe(layout2_2);
  });

  it('pembaca yang terlalu rapat ditolak', () => {
    const readerSpots = layout2_2.readerSpots.map((p) => ({ ...p }));
    readerSpots[1] = { ...(readerSpots[0] ?? { x: 0, y: 0 }) };
    const errors = validateLayout({ ...layout2_2, readerSpots }, level2_2);
    expect(errors.some((e) => e.includes('pembaca terlalu rapat'))).toBe(true);
  });

  it('id thread yang tidak cocok ditolak', () => {
    const errors = validateLayout(
      { ...layout2_2, writerIds: ['W1', 'X'] },
      level2_2,
    );
    expect(errors.some((e) => e.includes('readerIds dan writerIds'))).toBe(true);
  });
});