import { describe, expect, it } from 'vitest';
import { level1_5 } from '../../levels/module1/level-1-5';
import { flow1_5 } from '../layouts/level-1-5.flow.layout';
import { validateLayout } from '../layouts/validate';

// Level memakai layoutId '1-5' (arena lama) sampai arena alur resmi dipasang.
const level = { ...level1_5, layoutId: flow1_5.id };

describe('layout alur Level 1-5', () => {
  it('sah terhadap level', () => {
    expect(validateLayout(flow1_5, level)).toEqual([]);
  });

  it('menolak jumlah mesin yang tidak sama dengan kapasitas aula', () => {
    const broken = { ...flow1_5, machines: flow1_5.machines.slice(0, 1) };
    expect(validateLayout(broken, level).some((e) => e.includes('mesin'))).toBe(
      true,
    );
  });

  it('menolak titik yang terlalu rapat', () => {
    const [first] = flow1_5.workSpots;
    if (first === undefined) throw new Error('titik kerja kosong');
    const broken = {
      ...flow1_5,
      workSpots: [first, { x: first.x + 10, y: first.y }, ...flow1_5.workSpots.slice(2)],
    };
    expect(
      validateLayout(broken, level).some((e) => e.includes('terlalu rapat')),
    ).toBe(true);
  });

  it('menolak zona di luar area aman HUD', () => {
    const broken = {
      ...flow1_5,
      doneZone: { ...flow1_5.doneZone, x: 1200 },
    };
    expect(validateLayout(broken, level).length).toBeGreaterThan(0);
  });
});