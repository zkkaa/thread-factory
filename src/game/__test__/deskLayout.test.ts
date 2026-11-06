import { describe, expect, it } from 'vitest';
import { level1_4 } from '../../levels/module1/level-1-4';
import { getLayout } from '../layouts';
import { layout1_4 } from '../layouts/level-1-4.layout';
import type { DeskLayout } from '../layouts/types';
import { validateLayout } from '../layouts/validate';
import { validateDeskLayout } from '../layouts/validateDesk';

function withChange(change: Partial<DeskLayout>): DeskLayout {
  return { ...layout1_4, ...change };
}

describe('layout meja Level 1-4 (T-092)', () => {
  it('terdaftar di registri dan berjenis table', () => {
    const layout = getLayout('1-4');
    expect(layout?.kind).toBe('desk');
    expect(layout?.id).toBe(level1_4.layoutId);
  });

  it('sah terhadap level 1-4', () => {
    expect(validateDeskLayout(layout1_4, level1_4)).toEqual([]);
    expect(validateLayout(layout1_4, level1_4)).toEqual([]);
  });

  it('menolak id layout yang tidak cocok', () => {
    const errors = validateDeskLayout(withChange({ id: 'x' }), level1_4);
    expect(errors.join(' ')).toMatch(/layoutId/);
  });

  it('menolak thread perakit atau pengepak yang tidak ada', () => {
    expect(
      validateDeskLayout(withChange({ packerId: 'Z' }), level1_4).join(' '),
    ).toMatch(/pengepak "Z"/);
    expect(
      validateDeskLayout(withChange({ assemblerId: 'Z' }), level1_4).join(' '),
    ).toMatch(/perakit "Z"/);
  });

  it('menolak perakit dan pengepak yang sama', () => {
    const errors = validateDeskLayout(withChange({ packerId: 'A' }), level1_4);
    expect(errors.join(' ')).toMatch(/tidak boleh thread yang sama/);
  });

  it('menolak zona di luar area aman HUD', () => {
    const errors = validateDeskLayout(
      withChange({ workZone: { x: 0, y: 0, width: 200, height: 200 } }),
      level1_4,
    );
    expect(errors.join(' ')).toMatch(/area aman HUD/);
  });

  it('menolak zona yang bertumpuk', () => {
    const errors = validateDeskLayout(
      withChange({ table: { x: 400, y: 250, width: 240, height: 150 } }),
      level1_4,
    );
    expect(errors.join(' ')).toMatch(/bertumpuk/);
  });

  it('menolak titik robot di luar zonanya', () => {
    const errors = validateDeskLayout(
      withChange({ packerSpot: { x: 500, y: 300 } }),
      level1_4,
    );
    expect(errors.join(' ')).toMatch(/titik pengepak di luar zonanya/);
  });

  it('menolak meter baterai di luar zona pengepak', () => {
    const errors = validateDeskLayout(
      withChange({ battery: { x: 500, y: 300 } }),
      level1_4,
    );
    expect(errors.join(' ')).toMatch(/meter baterai/);
  });
});
