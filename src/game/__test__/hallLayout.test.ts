import { describe, expect, it } from 'vitest';
import { level1_3 } from '../../levels/module1/level-1-3';
import { hall1_3 } from '../layouts/level-1-3.hall.layout';
import { validateLayout } from '../layouts/validate';
import { validateHallLayout } from '../layouts/validateHall';
import { HALL } from '../theme';

describe('layout aula Level 1-3 (T-089)', () => {
  it('sah terhadap level 1-3, lewat validasi aula maupun validateLayout', () => {
    expect(validateHallLayout(hall1_3, level1_3)).toEqual([]);
    expect(validateLayout(hall1_3, level1_3)).toEqual([]);
  });

  it('jumlah mesin sama dengan kapasitas aula dan titik cukup untuk 8 robot', () => {
    expect(hall1_3.machines).toHaveLength(level1_3.areas?.aula ?? -1);
    expect(hall1_3.workSpots).toHaveLength(8);
    expect(hall1_3.doneSpots).toHaveLength(8);
    expect(hall1_3.queueSpots.length).toBeGreaterThanOrEqual(8);
    expect(
      hall1_3.machines.length + hall1_3.overflowSpots.length,
    ).toBeGreaterThanOrEqual(8);
  });

  it('gerbang menutupi ENTER_AREA sampai LEAVE_AREA', () => {
    const program = level1_3.threads[0]?.program ?? [];
    expect(program[hall1_3.gate.start]?.op).toBe('ENTER_AREA');
    expect(program[hall1_3.gate.end]?.op).toBe('LEAVE_AREA');
  });

  it('menolak id yang tidak cocok dengan level', () => {
    const bad = { ...hall1_3, id: 'x' };
    expect(validateHallLayout(bad, level1_3)).toContain(
      'id layout "x" != layoutId "1-3"',
    );
  });

  it('menolak jumlah mesin yang berbeda dari kapasitas', () => {
    const bad = { ...hall1_3, machines: hall1_3.machines.slice(0, 2) };
    expect(validateHallLayout(bad, level1_3)).toContain(
      'mesin 2, kapasitas area 3',
    );
  });

  it('menolak jumlah titik kerja yang salah', () => {
    const bad = { ...hall1_3, workSpots: hall1_3.workSpots.slice(0, 7) };
    expect(validateHallLayout(bad, level1_3)).toContain(
      'titik kerja 7, robot 8',
    );
  });

  it('menolak gerbang yang tidak dari ENTER_AREA sampai LEAVE_AREA', () => {
    const bad = { ...hall1_3, gate: { start: 0, end: 3 } };
    expect(validateHallLayout(bad, level1_3)).toContain(
      'gerbang harus dari ENTER_AREA sampai LEAVE_AREA',
    );
  });

  it('menolak titik yang terlalu rapat', () => {
    const first = hall1_3.workSpots[0] ?? { x: 0, y: 0 };
    const bad = {
      ...hall1_3,
      workSpots: hall1_3.workSpots.map((p, i) =>
        i === 1 ? { x: first.x + 10, y: first.y } : p,
      ),
    };
    expect(validateHallLayout(bad, level1_3)).toContain(
      `titik kerja terlalu rapat (minimal ${HALL.minSpotGap} px)`,
    );
  });

  it('menolak titik di luar zonanya', () => {
    const bad = {
      ...hall1_3,
      doneSpots: hall1_3.doneSpots.map((p) => ({ ...p, x: 10 })),
    };
    expect(validateHallLayout(bad, level1_3)).toContain(
      'titik selesai di luar zonanya',
    );
  });

  it('menolak zona yang bertumpuk', () => {
    const bad = { ...hall1_3, workZone: { ...hall1_3.workZone, width: 400 } };
    expect(validateHallLayout(bad, level1_3)).toContain(
      'zona kerja dan zona antrean bertumpuk',
    );
  });

  it('menolak zona di luar ARENA', () => {
    const bad = { ...hall1_3, hall: { ...hall1_3.hall, x: 1200 } };
    expect(validateHallLayout(bad, level1_3)).toContain(
      'zona aula di luar ARENA',
    );
  });

  it('menolak pintu yang tidak di tepi kiri aula', () => {
    const bad = { ...hall1_3, door: { x: 700, y: 350 } };
    expect(validateHallLayout(bad, level1_3)).toContain(
      'pintu aula harus di tepi kiri aula',
    );
  });

  it('menolak rak kartu yang menimpa zona', () => {
    const bad = { ...hall1_3, tokenRack: { x: 900, y: 300 } };
    expect(validateHallLayout(bad, level1_3)).toContain(
      'rak kartu menimpa zona aula',
    );
  });
});
