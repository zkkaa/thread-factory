import type { Point } from './layouts/types';
import { pointAt, type SampledPath } from './pathMath';

/** Titik layar tiap slot, dari fraksi jalan di layout (tanpa geseran jalur). */
export function slotPositions(
  path: SampledPath,
  fractions: readonly number[],
): Point[] {
  return fractions.map((fraction) => {
    const p = pointAt(path, fraction, 0);
    return { x: p.x, y: p.y };
  });
}

/**
 * Indeks slot terdekat dari `point` dalam jarak `maxDistance`, atau null.
 * `allowed` (opsional) membatasi pilihan ke slot yang sah saja; bila jarak
 * sama, slot berindeks lebih kecil menang.
 */
export function nearestSlot(
  point: Point,
  positions: readonly Point[],
  maxDistance: number,
  allowed?: ReadonlySet<number>,
): number | null {
  let best: number | null = null;
  let bestDistance = Infinity;
  for (let index = 0; index < positions.length; index += 1) {
    if (allowed !== undefined && !allowed.has(index)) continue;
    const slot = positions[index];
    if (slot === undefined) continue;
    const distance = Math.hypot(slot.x - point.x, slot.y - point.y);
    if (distance <= maxDistance && distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  }
  return best;
}
