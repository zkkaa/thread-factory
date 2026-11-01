import { describe, expect, it } from 'vitest';
import { ROAD_CURVE, ROAD_STRAIGHT } from '../assetManifest';
import { pointAt } from '../pathMath';
import { buildRoad, roadRectErrors } from '../roadGeometry';
import { ROAD } from '../theme';

// Lebar dan tinggi harus kelipatan ROAD.unit (48): 768 = 16 x 48, 480 = 10 x 48.
const RECT = { left: 256, top: 80, width: 768, height: 480 };

// Banyak ubin lurus per sisi, diturunkan dari ukuran jalan (bukan angka tertanam).
const ACROSS = (RECT.width - ROAD.corner * 2) / ROAD.unit;
const DOWN = (RECT.height - ROAD.corner * 2) / ROAD.unit;

describe('ukuran jalan sesuai aset', () => {
  it('satuan, lebar, dan sudut = ukuran aset x skala', () => {
    expect(ROAD.unit).toBe(16 * ROAD_STRAIGHT.scale);
    expect(ROAD.width).toBe(32 * ROAD_STRAIGHT.scale);
    expect(ROAD.corner).toBe(48 * ROAD_CURVE.scale);
  });

  it('kotak uji sendiri sah (kelipatan satuan dan cukup besar)', () => {
    expect(RECT.width % ROAD.unit).toBe(0);
    expect(RECT.height % ROAD.unit).toBe(0);
    expect(ACROSS).toBeGreaterThanOrEqual(0);
    expect(DOWN).toBeGreaterThanOrEqual(0);
  });
});

describe('roadRectErrors', () => {
  it('kotak yang benar tidak punya masalah', () => {
    expect(roadRectErrors(RECT)).toEqual([]);
  });
  it('menolak ukuran bukan kelipatan satuan', () => {
    expect(
      roadRectErrors({ ...RECT, width: RECT.width + 2 }).length,
    ).toBeGreaterThan(0);
  });
  it('menolak kotak lebih kecil dari dua sudut', () => {
    // 240 = 5 x 48: kelipatan satuan, tetapi kurang dari dua sudut (288).
    expect(roadRectErrors({ ...RECT, height: 160 }).length).toBeGreaterThan(0);
  });
  it('buildRoad melempar error untuk kotak tidak sah', () => {
    expect(() => buildRoad({ ...RECT, width: RECT.width + 2 })).toThrow();
  });
});

describe('buildRoad: ubin', () => {
  const { tiles } = buildRoad(RECT);
  const count = (kind: string) => tiles.filter((t) => t.kind === kind).length;

  it('jumlah dan jenis ubin', () => {
    expect(count('straight-h')).toBe(2 * ACROSS);
    expect(count('straight-v')).toBe(2 * DOWN);
    for (const kind of ['curve-tl', 'curve-tr', 'curve-bl', 'curve-br']) {
      expect(count(kind)).toBe(1);
    }
  });

  it('flip sudut sesuai aset (asli = kanan-atas)', () => {
    const flips = (kind: string) => {
      const t = tiles.find((tile) => tile.kind === kind);
      return [t?.flipX, t?.flipY];
    };
    expect(flips('curve-tr')).toEqual([false, false]);
    expect(flips('curve-tl')).toEqual([true, false]);
    expect(flips('curve-br')).toEqual([false, true]);
    expect(flips('curve-bl')).toEqual([true, true]);
  });

  it('menutup bingkai tanpa celah dan tanpa tumpang tindih', () => {
    const cells = new Set<string>();
    let total = 0;
    for (const t of tiles) {
      const i0 = (t.x - RECT.left) / ROAD.unit;
      const j0 = (t.y - RECT.top) / ROAD.unit;
      for (let i = i0; i < i0 + t.width / ROAD.unit; i++) {
        for (let j = j0; j < j0 + t.height / ROAD.unit; j++) {
          cells.add(`${i},${j}`);
          total += 1;
        }
      }
    }
    expect(cells.size).toBe(total); // tidak ada sel ganda
    const cols = RECT.width / ROAD.unit;
    const rows = RECT.height / ROAD.unit;
    const thick = ROAD.width / ROAD.unit;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const onRing =
          i < thick || j < thick || i >= cols - thick || j >= rows - thick;
        if (onRing) expect(cells.has(`${i},${j}`), `sel ${i},${j}`).toBe(true);
      }
    }
  });
});

describe('buildRoad: garis tengah', () => {
  const { tiles, path } = buildRoad(RECT);
  const inside = (x: number, y: number) =>
    tiles.some(
      (t) =>
        x >= t.x - 1e-6 &&
        x <= t.x + t.width + 1e-6 &&
        y >= t.y - 1e-6 &&
        y <= t.y + t.height + 1e-6,
    );

  it('tertutup: titik akhir sama dengan titik awal', () => {
    expect(path.points[path.points.length - 1]).toEqual(path.points[0]);
  });

  it('seluruh titik berada di atas ubin', () => {
    for (const p of path.points) expect(inside(p.x, p.y)).toBe(true);
  });

  it('panjang = sisi lurus + empat busur seperempat lingkaran', () => {
    const radius = ROAD.corner - ROAD.width / 2;
    const top = RECT.width - ROAD.width - 2 * radius;
    const side = RECT.height - ROAD.width - 2 * radius;
    const expected = 2 * top + 2 * side + 2 * Math.PI * radius;
    expect(Math.abs(path.length - expected)).toBeLessThan(1);
  });

  it('searah jarum jam: atas, kanan, bawah, kiri', () => {
    // Pecahan di bawah jatuh di tengah tiap sisi lurus untuk RECT ini.
    const top = pointAt(path, 0.105);
    const right = pointAt(path, 0.355);
    const bottom = pointAt(path, 0.605);
    const left = pointAt(path, 0.855);
    const half = ROAD.width / 2;
    expect(top.y).toBeCloseTo(RECT.top + half, 0);
    expect(right.x).toBeCloseTo(RECT.left + RECT.width - half, 0);
    expect(bottom.y).toBeCloseTo(RECT.top + RECT.height - half, 0);
    expect(left.x).toBeCloseTo(RECT.left + half, 0);
    expect(top.x).toBeLessThan(right.x);
  });
});