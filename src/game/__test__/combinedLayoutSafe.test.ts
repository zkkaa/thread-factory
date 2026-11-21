import { describe, expect, it } from 'vitest';
import { level1_5 } from '../../levels/module1/level-1-5';
import { layout1_5 } from '../layouts/level-1-5.combined.layout';
import type { Rect } from '../layouts/types';
import { validateLayout } from '../layouts/validate';
import { ARENA_SAFE, DOCK_ZONE } from '../theme';

const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

const inside = (inner: Rect, outer: Rect): boolean =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width &&
  inner.y + inner.height <= outer.y + outer.height;

const road: Rect = {
  x: layout1_5.road.left,
  y: layout1_5.road.top,
  width: layout1_5.road.width,
  height: layout1_5.road.height,
};

const cards: [string, Rect][] = [
  ['Perakit', layout1_5.assembler.zone],
  ['Penggudang', layout1_5.warehouse.zone],
  ['Aula', layout1_5.area.zone],
  ['Pengepak', layout1_5.packer.zone],
];

describe('layout Level 1-5: area aman dan dok (T-094)', () => {
  it('sah terhadap level 1-5', () => {
    expect(validateLayout(layout1_5, level1_5)).toEqual([]);
  });

  it('loop dan semua kartu berada di dalam ARENA_SAFE', () => {
    expect(inside(road, ARENA_SAFE)).toBe(true);
    for (const [name, rect] of cards) {
      expect(inside(rect, ARENA_SAFE), name).toBe(true);
    }
  });

  it('loop dan kartu tidak menyentuh DOCK_ZONE', () => {
    expect(overlaps(road, DOCK_ZONE)).toBe(false);
    for (const [name, rect] of cards) {
      expect(overlaps(rect, DOCK_ZONE), name).toBe(false);
    }
  });

  it('kartu tidak bertumpuk satu sama lain maupun dengan loop', () => {
    for (const [name, rect] of cards) {
      expect(overlaps(rect, road), name).toBe(false);
    }
    for (let i = 0; i < cards.length; i += 1) {
      for (let j = i + 1; j < cards.length; j += 1) {
        expect(overlaps(cards[i]![1], cards[j]![1])).toBe(false);
      }
    }
  });

  it('panel Pintu Kunci berada di dalam kartu Penggudang', () => {
    expect(
      inside(layout1_5.warehouse.doorPanel, layout1_5.warehouse.zone),
    ).toBe(true);
  });

  it('menolak kartu yang menimpa dok', () => {
    const bad = {
      ...layout1_5,
      packer: {
        ...layout1_5.packer,
        zone: { ...layout1_5.packer.zone, x: 500 },
      },
    };
    expect(
      validateLayout(bad, level1_5).some((e) => e.includes('dok toolbox')),
    ).toBe(true);
  });

  it('menolak panel Pintu Kunci di luar kartu Penggudang', () => {
    const bad = {
      ...layout1_5,
      warehouse: {
        ...layout1_5.warehouse,
        doorPanel: { x: 100, y: 100, width: 100, height: 40 },
      },
    };
    expect(validateLayout(bad, level1_5)).toContain(
      'panel Pintu Kunci di luar zona Penggudang',
    );
  });
});