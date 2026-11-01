import { describe, expect, it } from 'vitest';
import type { LevelMapLayout } from '../levelMapLayout';
import { buildRoadSegments, smoothPath } from '../levelMapPath';

const layout: LevelMapLayout = {
  mapImage: 'peta.jpg',
  padWidth: 10,
  pads: {
    a: { x: 10, y: 10 },
    b: { x: 20, y: 20 },
    c: { x: 30, y: 10 },
  },
  via: [[], [{ x: 25, y: 15 }]],
  robot: { x: 20, y: 60, width: 5 },
};

describe('smoothPath', () => {
  it('kurang dari dua titik menghasilkan string kosong', () => {
    expect(smoothPath([])).toBe('');
    expect(smoothPath([{ x: 1, y: 1 }])).toBe('');
  });

  it('dua titik: satu kurva Bezier dengan koordinat diskalakan ke 1600x900', () => {
    expect(
      smoothPath([
        { x: 10, y: 10 },
        { x: 20, y: 20 },
      ]),
    ).toBe('M 160.0 90.0 C 186.7 105.0 293.3 165.0 320.0 180.0');
  });

  it('titik tambahan menambah satu kurva per ruas', () => {
    const d = smoothPath([
      { x: 0, y: 0 },
      { x: 50, y: 50 },
      { x: 100, y: 0 },
    ]);
    expect(d.startsWith('M 0.0 0.0')).toBe(true);
    expect((d.match(/C/g) ?? []).length).toBe(2);
  });
});

describe('buildRoadSegments', () => {
  it('satu ruas per pasangan level berurutan', () => {
    const segments = buildRoadSegments(['a', 'b', 'c'], layout, () => false);
    expect(segments.map((s) => [s.fromId, s.toId])).toEqual([
      ['a', 'b'],
      ['b', 'c'],
    ]);
    expect(segments.every((s) => s.d.startsWith('M '))).toBe(true);
  });

  it('ruas terisi bila level asalnya selesai', () => {
    const segments = buildRoadSegments(
      ['a', 'b', 'c'],
      layout,
      (id) => id === 'a',
    );
    expect(segments.map((s) => s.filled)).toEqual([true, false]);
  });

  it('titik via menambah kurva pada ruasnya', () => {
    const segments = buildRoadSegments(['a', 'b', 'c'], layout, () => false);
    expect((segments[0].d.match(/C/g) ?? []).length).toBe(1);
    expect((segments[1].d.match(/C/g) ?? []).length).toBe(2);
  });

  it('level tanpa titik di layout dilewati', () => {
    const segments = buildRoadSegments(['a', 'x'], layout, () => true);
    expect(segments).toEqual([]);
  });
});
