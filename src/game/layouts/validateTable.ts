import type { LevelDefinition } from '../../levels/types';
import { HALL, HUD_SAFE } from '../theme';
import type { Point, TableLayout } from './types';

const inSafe = (p: Point): boolean =>
  p.x >= HUD_SAFE.x &&
  p.x <= HUD_SAFE.x + HUD_SAFE.width &&
  p.y >= HUD_SAFE.y &&
  p.y <= HUD_SAFE.y + HUD_SAFE.height;

function smallestGap(points: readonly Point[]): number {
  let smallest = Infinity;
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const a = points[i];
      const b = points[j];
      if (a === undefined || b === undefined) continue;
      smallest = Math.min(smallest, Math.hypot(a.x - b.x, a.y - b.y));
    }
  }
  return smallest;
}

/** Memeriksa layout meja terhadap level. Mengembalikan daftar masalah (kosong = sah). */
export function validateTableLayout(
  layout: TableLayout,
  level: LevelDefinition,
): string[] {
  const errors: string[] = [];
  const threadIds = level.threads.map((t) => t.id);
  const mutexIds = level.resources
    .filter((r) => r.kind === 'mutex')
    .map((r) => r.id);

  if (layout.id !== level.layoutId) {
    errors.push(`id layout "${layout.id}" != layoutId "${level.layoutId}"`);
  }
  if (layout.seats.length !== layout.seatIds.length) {
    errors.push('seats dan seatIds harus sama panjang');
  }
  if (layout.seatIds.join('|') !== threadIds.join('|')) {
    errors.push('seatIds harus sama dengan id thread level (urutannya juga)');
  }
  if (layout.forks.length !== layout.forkIds.length) {
    errors.push('forks dan forkIds harus sama panjang');
  }
  if (layout.forkIds.some((id) => !mutexIds.includes(id))) {
    errors.push('forkIds memuat id yang bukan mutex di level');
  }
  if (layout.forkIds.length !== layout.seatIds.length) {
    errors.push('jumlah kunci harus sama dengan jumlah teknisi');
  }

  const { center, radius } = layout.table;
  const corners: Point[] = [
    { x: center.x - radius, y: center.y - radius },
    { x: center.x + radius, y: center.y + radius },
  ];
  if (corners.some((p) => !inSafe(p))) errors.push('meja di luar area aman HUD');
  if (layout.seats.some((p) => !inSafe(p))) {
    errors.push('teknisi di luar area aman HUD');
  }
  if (layout.forks.some((p) => !inSafe(p))) {
    errors.push('kunci di luar area aman HUD');
  }

  const gap = HALL.minSpotGap;
  if (smallestGap(layout.seats) < gap) {
    errors.push(`teknisi terlalu rapat (minimal ${gap} px)`);
  }
  if (smallestGap(layout.forks) < gap) {
    errors.push(`kunci terlalu rapat (minimal ${gap} px)`);
  }
  return errors;
}   