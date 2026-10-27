import type { Point } from './layouts/types';

/** Jalan tertutup yang sudah disampel menjadi garis patah dengan panjang kumulatif. */
export interface SampledPath {
  points: Point[];
  /** cumulative[i] = jarak dari titik 0 ke titik i. */
  cumulative: number[];
  length: number;
}

export interface PathPoint {
  x: number;
  y: number;
  /** Arah gerak (radian). */
  angle: number;
}

function control(points: readonly Point[], i: number): Point {
  const n = points.length;
  const p = points[((i % n) + n) % n];
  if (p === undefined) throw new Error('Titik kontrol tidak ada.');
  return p;
}

const catmullRom = (a: number, b: number, c: number, d: number, t: number) =>
  0.5 *
  (2 * b +
    (-a + c) * t +
    (2 * a - 5 * b + 4 * c - d) * t * t +
    (-a + 3 * b - 3 * c + d) * t * t * t);

/**
 * Menyampel loop tertutup yang melewati semua titik kontrol (Catmull-Rom).
 * Titik terakhir sama dengan titik pertama supaya satu putaran utuh.
 */
export function sampleClosedPath(
  controlPoints: readonly Point[],
  perSegment = 24,
): SampledPath {
  const n = controlPoints.length;
  if (n < 3) throw new Error('Jalan butuh minimal 3 titik kontrol.');
  const points: Point[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = control(controlPoints, i - 1);
    const p1 = control(controlPoints, i);
    const p2 = control(controlPoints, i + 1);
    const p3 = control(controlPoints, i + 2);
    for (let s = 0; s < perSegment; s++) {
      const t = s / perSegment;
      points.push({
        x: catmullRom(p0.x, p1.x, p2.x, p3.x, t),
        y: catmullRom(p0.y, p1.y, p2.y, p3.y, t),
      });
    }
  }
  const first = points[0];
  if (first === undefined) throw new Error('Jalan kosong.');
  points.push({ ...first });

  const cumulative: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const prev = cumulative[i - 1] ?? 0;
    cumulative.push(
      a !== undefined && b !== undefined
        ? prev + Math.hypot(b.x - a.x, b.y - a.y)
        : prev,
    );
  }
  return { points, cumulative, length: cumulative[cumulative.length - 1] ?? 0 };
}

/**
 * Titik pada jalan di pecahan panjang `fraction` (di luar 0..1 dibungkus).
 * `offset` menggeser tegak lurus jalan: positif = sisi kanan arah gerak
 * (untuk loop searah jarum jam, itu sisi dalam). Dipakai untuk jalur sejajar.
 */
export function pointAt(
  path: SampledPath,
  fraction: number,
  offset = 0,
): PathPoint {
  const f = fraction - Math.floor(fraction);
  const target = f * path.length;
  const last = path.cumulative.length - 1;
  let i = 1;
  while (i < last && (path.cumulative[i] ?? 0) < target) i++;

  const p = path.points[i - 1];
  const q = path.points[i];
  if (p === undefined || q === undefined) throw new Error('Jalan kosong.');
  const a = path.cumulative[i - 1] ?? 0;
  const b = path.cumulative[i] ?? a;
  const seg = b - a;
  const u = seg > 0 ? (target - a) / seg : 0;
  const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
  const tx = (q.x - p.x) / len;
  const ty = (q.y - p.y) / len;
  return {
    x: p.x + (q.x - p.x) * u + -ty * offset,
    y: p.y + (q.y - p.y) * u + tx * offset,
    angle: Math.atan2(ty, tx),
  };
}

/**
 * Titik akhir gerak maju dari `from` ke `to` (keduanya 0..1). Bila `to` ada di
 * belakang, robot melewati ujung jalan (putaran berikutnya): hasilnya `to + 1`.
 */
export function forwardEnd(from: number, to: number): number {
  return to >= from ? to : to + 1;
}
