import type { LevelMapLayout, MapPoint } from './levelMapLayout';

/** Ukuran sistem koordinat SVG; sama dengan rasio kotak peta 16:9. */
export const VIEW_WIDTH = 1600;
export const VIEW_HEIGHT = 900;

const SCALE_X = VIEW_WIDTH / 100;
const SCALE_Y = VIEW_HEIGHT / 100;

const fmt = (value: number): string => value.toFixed(1);

/**
 * Kurva mulus (Catmull-Rom diubah menjadi Bezier kubik) melalui titik-titik
 * dalam persen. Mengembalikan string atribut `d` SVG, kosong bila titik < 2.
 */
export function smoothPath(points: readonly MapPoint[]): string {
  if (points.length < 2) return '';
  const x = (p: MapPoint): number => p.x * SCALE_X;
  const y = (p: MapPoint): number => p.y * SCALE_Y;
  let d = `M ${fmt(x(points[0]))} ${fmt(y(points[0]))}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const c1x = x(p1) + (x(p2) - x(p0)) / 6;
    const c1y = y(p1) + (y(p2) - y(p0)) / 6;
    const c2x = x(p2) - (x(p3) - x(p1)) / 6;
    const c2y = y(p2) - (y(p3) - y(p1)) / 6;
    d += ` C ${fmt(c1x)} ${fmt(c1y)} ${fmt(c2x)} ${fmt(c2y)} ${fmt(x(p2))} ${fmt(y(p2))}`;
  }
  return d;
}

/** Satu ruas jalan antara dua level berurutan. */
export interface RoadSegment {
  fromId: string;
  toId: string;
  d: string;
  /** Terisi kuning bila level asal ruas ini sudah selesai. */
  filled: boolean;
}

/**
 * Menyusun ruas jalan antar level berurutan dari data tata letak. Ruas yang
 * titiknya tidak ada di layout dilewati.
 */
export function buildRoadSegments(
  levelIds: readonly string[],
  layout: LevelMapLayout,
  isCleared: (levelId: string) => boolean,
): RoadSegment[] {
  const segments: RoadSegment[] = [];
  for (let i = 0; i < levelIds.length - 1; i += 1) {
    const fromId = levelIds[i];
    const toId = levelIds[i + 1];
    const from = layout.pads[fromId];
    const to = layout.pads[toId];
    if (from === undefined || to === undefined) continue;
    const via = layout.via[i] ?? [];
    segments.push({
      fromId,
      toId,
      d: smoothPath([from, ...via, to]),
      filled: isCleared(fromId),
    });
  }
  return segments;
}
