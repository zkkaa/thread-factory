import type { LevelDefinition } from '../../levels/types';
import { HALL, HUD_SAFE } from '../theme';
import type { BoardLayout, Point, Rect } from './types';

const rectInSafe = (r: Rect): boolean =>
  r.x >= HUD_SAFE.x &&
  r.y >= HUD_SAFE.y &&
  r.x + r.width <= HUD_SAFE.x + HUD_SAFE.width &&
  r.y + r.height <= HUD_SAFE.y + HUD_SAFE.height;

const inRect = (p: Point, r: Rect): boolean =>
  p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height;

const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

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

/** Memeriksa layout papan terhadap level. Mengembalikan daftar masalah (kosong = sah). */
export function validateBoardLayout(
  layout: BoardLayout,
  level: LevelDefinition,
): string[] {
  const errors: string[] = [];
  const threadIds = level.threads.map((t) => t.id);

  if (layout.id !== level.layoutId) {
    errors.push(`id layout "${layout.id}" != layoutId "${level.layoutId}"`);
  }
  if (
    !level.resources.some((r) => r.kind === 'board' && r.id === layout.boardId)
  ) {
    errors.push(`level tidak punya papan "${layout.boardId}"`);
  }
  const all = [...layout.readerIds, ...layout.writerIds];
  if ([...all].sort().join('|') !== [...threadIds].sort().join('|')) {
    errors.push('readerIds dan writerIds harus mencakup semua thread level');
  }
  if (layout.readerSpots.length !== layout.readerIds.length) {
    errors.push('readerSpots dan readerIds harus sama panjang');
  }
  if (layout.writerSpots.length !== layout.writerIds.length) {
    errors.push('writerSpots dan writerIds harus sama panjang');
  }

  const zones: [string, Rect][] = [
    ['pembaca', layout.readerZone],
    ['penulis', layout.writerZone],
    ['papan', layout.board],
  ];
  for (const [name, rect] of zones) {
    if (!rectInSafe(rect)) errors.push(`zona ${name} di luar area aman HUD`);
  }
  for (let i = 0; i < zones.length; i += 1) {
    for (let j = i + 1; j < zones.length; j += 1) {
      const a = zones[i];
      const b = zones[j];
      if (a !== undefined && b !== undefined && overlaps(a[1], b[1])) {
        errors.push(`zona ${a[0]} dan zona ${b[0]} bertumpuk`);
      }
    }
  }
  if (layout.readerSpots.some((p) => !inRect(p, layout.readerZone))) {
    errors.push('titik pembaca di luar zonanya');
  }
  if (layout.writerSpots.some((p) => !inRect(p, layout.writerZone))) {
    errors.push('titik penulis di luar zonanya');
  }
  if (smallestGap(layout.readerSpots) < HALL.minSpotGap) {
    errors.push(`titik pembaca terlalu rapat (minimal ${HALL.minSpotGap} px)`);
  }
  if (smallestGap(layout.writerSpots) < HALL.minSpotGap) {
    errors.push(`titik penulis terlalu rapat (minimal ${HALL.minSpotGap} px)`);
  }
  return errors;
}
