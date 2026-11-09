import { describe, expect, it } from 'vitest';
import { level2_1 } from '../../levels/module2/level-2-1';
import { layout2_1 } from '../layouts/level-2-1.layout';
import { validateLayout } from '../layouts/validate';

describe('layout ban 2-1 (T-096)', () => {
  it('sah terhadap level 2-1', () => {
    expect(validateLayout(layout2_1, level2_1)).toEqual([]);
  });

  it('menolak ban di luar HUD_SAFE', () => {
    const bad = { ...layout2_1, belt: { ...layout2_1.belt, x: 100 } };
    expect(validateLayout(bad, level2_1)).toContain('ban di luar HUD_SAFE');
  });

  it('menolak thread yang tidak ada di level', () => {
    const bad = { ...layout2_1, producerIds: ['P1', 'X9'] };
    expect(validateLayout(bad, level2_1).some((e) => e.includes('"X9"'))).toBe(
      true,
    );
  });

  it('menolak ban yang tidak dideklarasikan', () => {
    const bad = { ...layout2_1, bufferId: 'lain' };
    expect(validateLayout(bad, level2_1).length).toBeGreaterThan(0);
  });

  it('menolak titik robot di luar zonanya', () => {
    const bad = {
      ...layout2_1,
      consumerSpots: [{ x: 100, y: 100 }, ...layout2_1.consumerSpots.slice(1)],
    };
    expect(validateLayout(bad, level2_1)).toContain(
      'pengepak: titik di luar zona',
    );
  });
});
