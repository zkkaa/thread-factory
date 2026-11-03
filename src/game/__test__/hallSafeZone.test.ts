import { describe, expect, it } from 'vitest';
import { level1_3 } from '../../levels/module1/level-1-3';
import { hall1_3 } from '../layouts/level-1-3.hall.layout';
import type { Point, Rect } from '../layouts/types';
import { validateHallLayout } from '../layouts/validateHall';
import { HUD_SAFE } from '../theme';

const pointSafe = (p: Point): boolean =>
  p.x >= HUD_SAFE.x &&
  p.x <= HUD_SAFE.x + HUD_SAFE.width &&
  p.y >= HUD_SAFE.y &&
  p.y <= HUD_SAFE.y + HUD_SAFE.height;

const rectSafe = (r: Rect): boolean =>
  pointSafe({ x: r.x, y: r.y }) &&
  pointSafe({ x: r.x + r.width, y: r.y + r.height });

describe('layout aula berada di area aman HUD (T-089 A2)', () => {
  it('semua zona dan titik robot di dalam HUD_SAFE', () => {
    const zones = [
      hall1_3.workZone,
      hall1_3.queueZone,
      hall1_3.hall,
      hall1_3.doneZone,
    ];
    expect(zones.every(rectSafe)).toBe(true);
    const spots = [
      ...hall1_3.workSpots,
      ...hall1_3.queueSpots,
      ...hall1_3.machines,
      ...hall1_3.overflowSpots,
      ...hall1_3.doneSpots,
      hall1_3.door,
    ];
    expect(spots.every(pointSafe)).toBe(true);
  });

  it('menolak zona yang masuk ke area panel HUD kiri', () => {
    const bad = { ...hall1_3, workZone: { ...hall1_3.workZone, x: 100 } };
    expect(validateHallLayout(bad, level1_3)).toContain(
      'zona kerja di luar area aman HUD',
    );
  });

  it('menolak rak kartu yang masuk ke bar kontrol atas', () => {
    const bad = { ...hall1_3, tokenRack: { x: 690, y: 50 } };
    expect(validateHallLayout(bad, level1_3)).toContain(
      'rak kartu di luar area aman HUD',
    );
  });
});
