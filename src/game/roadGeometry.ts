import type { RoadRect } from './layouts/types';
import type { SampledPath } from './pathMath';
import { ROAD } from './theme';

export type RoadTileKind =
  | 'straight-h'
  | 'straight-v'
  | 'curve-tl'
  | 'curve-tr'
  | 'curve-bl'
  | 'curve-br';

/** Satu ubin jalan: kotak di layar plus cara memutar tekstur aslinya. */
export interface RoadTile {
  kind: RoadTileKind;
  /** Pojok kiri-atas kotak di layar. */
  x: number;
  y: number;
  width: number;
  height: number;
  flipX: boolean;
  flipY: boolean;
  /** Jalan tegak: tekstur lurus diputar 90 derajat terhadap pusat kotak. */
  rotate90: boolean;
}

export interface RoadGeometry {
  tiles: RoadTile[];
  /** Garis tengah jalan, searah jarum jam, tertutup (titik akhir = awal). */
  path: SampledPath;
}

/** Jumlah segmen per busur seperempat lingkaran. */
const ARC_STEPS = 32;

/** Masalah pada kotak jalan; daftar kosong berarti sah. */
export function roadRectErrors(rect: RoadRect): string[] {
  const errors: string[] = [];
  const { unit, corner } = ROAD;
  for (const [name, value] of Object.entries(rect)) {
    if (!Number.isInteger(value)) errors.push(`${name} jalan harus bulat`);
  }
  if (rect.width % unit !== 0 || rect.height % unit !== 0) {
    errors.push(`lebar dan tinggi jalan harus kelipatan ${unit} px`);
  }
  if (rect.width < corner * 2 || rect.height < corner * 2) {
    errors.push(`jalan minimal ${corner * 2} x ${corner * 2} px`);
  }
  return errors;
}

function measure(points: { x: number; y: number }[]): SampledPath {
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
 * Ubin dan garis tengah jalan kotak-bulat dari satu kotak luar. Fungsi murni.
 * Garis tengah mulai di awal sisi atas, lalu searah jarum jam: sisi atas,
 * sudut kanan-atas, sisi kanan, dst. Sudut berjari-jari (corner - lebar/2).
 */
export function buildRoad(rect: RoadRect): RoadGeometry {
  const errors = roadRectErrors(rect);
  if (errors.length > 0) throw new Error(errors.join('; '));

  const { unit, corner, width: road } = ROAD;
  const left = rect.left;
  const top = rect.top;
  const right = rect.left + rect.width;
  const bottom = rect.top + rect.height;

  const tiles: RoadTile[] = [
    {
      kind: 'curve-tl',
      x: left,
      y: top,
      width: corner,
      height: corner,
      flipX: true,
      flipY: false,
      rotate90: false,
    },
    {
      kind: 'curve-tr',
      x: right - corner,
      y: top,
      width: corner,
      height: corner,
      flipX: false,
      flipY: false,
      rotate90: false,
    },
    {
      kind: 'curve-br',
      x: right - corner,
      y: bottom - corner,
      width: corner,
      height: corner,
      flipX: false,
      flipY: true,
      rotate90: false,
    },
    {
      kind: 'curve-bl',
      x: left,
      y: bottom - corner,
      width: corner,
      height: corner,
      flipX: true,
      flipY: true,
      rotate90: false,
    },
  ];
  const across = (rect.width - corner * 2) / unit;
  const down = (rect.height - corner * 2) / unit;
  for (let i = 0; i < across; i++) {
    const x = left + corner + i * unit;
    tiles.push(
      {
        kind: 'straight-h',
        x,
        y: top,
        width: unit,
        height: road,
        flipX: false,
        flipY: false,
        rotate90: false,
      },
      {
        kind: 'straight-h',
        x,
        y: bottom - road,
        width: unit,
        height: road,
        flipX: false,
        flipY: false,
        rotate90: false,
      },
    );
  }
  for (let j = 0; j < down; j++) {
    const y = top + corner + j * unit;
    tiles.push(
      {
        kind: 'straight-v',
        x: left,
        y,
        width: road,
        height: unit,
        flipX: false,
        flipY: false,
        rotate90: true,
      },
      {
        kind: 'straight-v',
        x: right - road,
        y,
        width: road,
        height: unit,
        flipX: false,
        flipY: false,
        rotate90: true,
      },
    );
  }

  // Garis tengah: busur seperempat lingkaran, di antaranya garis lurus.
  const half = road / 2;
  const radius = corner - half;
  const l = left + half;
  const t = top + half;
  const r = right - half;
  const b = bottom - half;
  const arc = (cx: number, cy: number, from: number, to: number) =>
    Array.from({ length: ARC_STEPS + 1 }, (_, i) => {
      const angle = ((from + ((to - from) * i) / ARC_STEPS) * Math.PI) / 180;
      return {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });
  const start = { x: l + radius, y: t };
  const points = [
    start,
    ...arc(r - radius, t + radius, -90, 0),
    ...arc(r - radius, b - radius, 0, 90),
    ...arc(l + radius, b - radius, 90, 180),
    ...arc(l + radius, t + radius, 180, 270),
  ];
  // Titik terakhir secara matematis sama dengan awal; samakan persis.
  points[points.length - 1] = { ...start };

  return { tiles, path: measure(points) };
}
