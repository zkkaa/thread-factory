import type { LevelDefinition } from '../../levels/types';
import { HUD_SAFE } from '../theme';
import type { BeltLayout, Point, Rect } from './types';

const rectInSafe = (r: Rect): boolean =>
  r.x >= HUD_SAFE.x &&
  r.y >= HUD_SAFE.y &&
  r.x + r.width <= HUD_SAFE.x + HUD_SAFE.width &&
  r.y + r.height <= HUD_SAFE.y + HUD_SAFE.height;

const pointInRect = (p: Point, r: Rect): boolean =>
  p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height;

/** Memeriksa layout ban terhadap level. Kosong = sah. */
export function validateBeltLayout(
  layout: BeltLayout,
  level: LevelDefinition,
): string[] {
  const errors: string[] = [];
  if (layout.id !== level.layoutId) {
    errors.push(`id layout "${layout.id}" != layoutId "${level.layoutId}"`);
  }
  if (level.buffers?.[layout.bufferId] === undefined) {
    errors.push(`ban "${layout.bufferId}" tidak dideklarasikan di level`);
  }

  const side = (
    name: string,
    ids: readonly string[],
    spots: readonly Point[],
    zone: Rect,
  ): void => {
    if (ids.length !== spots.length) {
      errors.push(`${name}: jumlah id dan titik harus sama`);
    }
    for (const id of ids) {
      if (!level.threads.some((t) => t.id === id)) {
        errors.push(`${name}: thread "${id}" tidak ada di level`);
      }
    }
    for (const spot of spots) {
      if (!pointInRect(spot, zone)) errors.push(`${name}: titik di luar zona`);
    }
  };
  side(
    'perakit',
    layout.producerIds,
    layout.producerSpots,
    layout.producerZone,
  );
  side(
    'pengepak',
    layout.consumerIds,
    layout.consumerSpots,
    layout.consumerZone,
  );

  const all = [...layout.producerIds, ...layout.consumerIds];
  if (new Set(all).size !== all.length)
    errors.push('id thread ganda di layout');
  if (all.length !== level.threads.length) {
    errors.push('setiap thread level harus punya titik di layout');
  }

  for (const [name, rect] of [
    ['ban', layout.belt],
    ['zona perakit', layout.producerZone],
    ['zona pengepak', layout.consumerZone],
  ] as const) {
    if (!rectInSafe(rect)) errors.push(`${name} di luar HUD_SAFE`);
  }
  return errors;
}
