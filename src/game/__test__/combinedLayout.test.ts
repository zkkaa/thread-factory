import { describe, expect, it } from 'vitest';
import { level1_5 } from '../../levels/module1/level-1-5';
import { getLayout } from '../layouts';
import { layout1_5 } from '../layouts/level-1-5.combined.layout';
import type { CombinedLayout } from '../layouts/types';
import { validateLayout } from '../layouts/validate';
import { validateCombinedLayout } from '../layouts/validateCombined';

function withChange(change: Partial<CombinedLayout>): CombinedLayout {
  return { ...layout1_5, ...change };
}

describe('layout gabungan Level 1-5 (T-094)', () => {
  it('terdaftar sebagai arena gabungan dengan jalur, papan, dan empat stasiun', () => {
    const layout = getLayout('1-5');
    expect(layout?.kind).toBe('combined');
    expect(layout?.id).toBe(level1_5.layoutId);
    expect(validateLayout(layout1_5, level1_5)).toEqual([]);
    expect(layout1_5.checkpoints).toHaveLength(7);
    expect(layout1_5.slots).toHaveLength(8);
    expect(layout1_5.area.machines).toHaveLength(1);
  });

  it('menolak stasiun yang bertumpuk atau keluar dari area aman HUD', () => {
    expect(
      validateCombinedLayout(
        withChange({
          packer: { ...layout1_5.packer, zone: layout1_5.area.zone },
        }),
        level1_5,
      ).join(' '),
    ).toContain('bertumpuk');

    expect(
      validateCombinedLayout(
        withChange({
          assembler: {
            ...layout1_5.assembler,
            zone: { x: 0, y: 0, width: 200, height: 100 },
          },
        }),
        level1_5,
      ).join(' '),
    ).toContain('area aman HUD');
  });

  it('menolak id peran yang tidak terdaftar atau dipakai dua peran', () => {
    expect(
      validateCombinedLayout(
        withChange({
          warehouse: { ...layout1_5.warehouse, threadId: 'X' },
        }),
        level1_5,
      ).join(' '),
    ).toContain('thread "X" yang tidak ada');

    expect(
      validateCombinedLayout(
        withChange({
          warehouse: {
            ...layout1_5.warehouse,
            threadId: layout1_5.assembler.threadId,
          },
        }),
        level1_5,
      ).join(' '),
    ).toContain('thread yang berbeda');
  });

  it('jumlah mesin sesuai kapasitas dan ikon pengepak berada di zonanya', () => {
    expect(
      validateCombinedLayout(
        withChange({ area: { ...layout1_5.area, machines: [] } }),
        level1_5,
      ).join(' '),
    ).toContain('kapasitas area');

    expect(
      validateCombinedLayout(
        withChange({
          packer: { ...layout1_5.packer, lamp: { x: 900, y: 475 } },
        }),
        level1_5,
      ).join(' '),
    ).toContain('lampu sinyal di luar zona pengepak');
  });

  it('gerbang Kartu Akses membungkus instruksi aula dan pintunya berada di zona', () => {
    expect(
      validateCombinedLayout(
        withChange({
          area: { ...layout1_5.area, gate: { start: 3, end: 6 } },
        }),
        level1_5,
      ).join(' '),
    ).toContain('membungkus ENTER_AREA dan LEAVE_AREA');

    expect(
      validateCombinedLayout(
        withChange({
          area: { ...layout1_5.area, door: { x: 100, y: 100 } },
        }),
        level1_5,
      ).join(' '),
    ).toContain('pintu Kartu Akses di luar zona aula');
  });

  it('layout mengacu pada mutex, semaphore, dan condition variable di data level', () => {
    expect(
      validateCombinedLayout(
        withChange({
          tools: { ...layout1_5.tools, semaphoreId: 'tidak-ada' },
        }),
        level1_5,
      ).join(' '),
    ).toContain('semaphore "tidak-ada" tidak terdaftar');
  });
});
