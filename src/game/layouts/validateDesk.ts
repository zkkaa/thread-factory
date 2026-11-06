import type { LevelDefinition } from '../../levels/types';
import { ARENA, HALL, HUD_SAFE } from '../theme';
import type { Point, Rect, DeskLayout } from './types';

const rectInArena = (rect: Rect): boolean =>
  rect.x >= 0 &&
  rect.y >= 0 &&
  rect.x + rect.width <= ARENA.width &&
  rect.y + rect.height <= ARENA.height;

const inRect = (p: Point, rect: Rect): boolean =>
  p.x >= rect.x &&
  p.x <= rect.x + rect.width &&
  p.y >= rect.y &&
  p.y <= rect.y + rect.height;

const rectInSafe = (rect: Rect): boolean =>
  rect.x >= HUD_SAFE.x &&
  rect.y >= HUD_SAFE.y &&
  rect.x + rect.width <= HUD_SAFE.x + HUD_SAFE.width &&
  rect.y + rect.height <= HUD_SAFE.y + HUD_SAFE.height;

const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

/** Memeriksa layout meja terhadap level. Mengembalikan daftar masalah (kosong = sah). */
export function validateDeskLayout(
  layout: DeskLayout,
  level: LevelDefinition,
): string[] {
  const errors: string[] = [];

  if (layout.id !== level.layoutId) {
    errors.push(`id layout "${layout.id}" != layoutId "${level.layoutId}"`);
  }

  const ids = new Set(level.threads.map((thread) => thread.id));
  if (!ids.has(layout.assemblerId)) {
    errors.push(`perakit "${layout.assemblerId}" tidak ada di level`);
  }
  if (!ids.has(layout.packerId)) {
    errors.push(`pengepak "${layout.packerId}" tidak ada di level`);
  }
  if (layout.assemblerId === layout.packerId) {
    errors.push('perakit dan pengepak tidak boleh thread yang sama');
  }
  if (
    !Object.prototype.hasOwnProperty.call(
      level.sharedVars,
      level.goal.target.variable,
    )
  ) {
    errors.push(`variabel target "${level.goal.target.variable}" tidak ada`);
  }

  const zones: [string, Rect][] = [
    ['perakit', layout.workZone],
    ['meja', layout.table],
    ['pengepak', layout.packZone],
  ];
  for (const [name, rect] of zones) {
    if (!rectInArena(rect)) errors.push(`zona ${name} di luar ARENA`);
    if (!rectInSafe(rect)) errors.push(`zona ${name} di luar area aman HUD`);
  }
  for (let i = 0; i < zones.length; i += 1) {
    for (let j = i + 1; j < zones.length; j += 1) {
      const a = zones[i];
      const b = zones[j];
      if (a === undefined || b === undefined) continue;
      if (overlaps(a[1], b[1])) {
        errors.push(`zona ${a[0]} dan zona ${b[0]} bertumpuk`);
      }
    }
  }

  if (!inRect(layout.assemblerSpot, layout.workZone)) {
    errors.push('titik perakit di luar zonanya');
  }
  if (!inRect(layout.packerSpot, layout.packZone)) {
    errors.push('titik pengepak di luar zonanya');
  }
  if (!inRect(layout.battery, layout.packZone)) {
    errors.push('meter baterai di luar zona pengepak');
  }
  if (!inRect(layout.lamp, HUD_SAFE)) {
    errors.push('lampu sinyal di luar area aman HUD');
  }

  const gap = Math.hypot(
    layout.assemblerSpot.x - layout.packerSpot.x,
    layout.assemblerSpot.y - layout.packerSpot.y,
  );
  if (gap < HALL.minSpotGap) {
    errors.push(`titik robot terlalu rapat (minimal ${HALL.minSpotGap} px)`);
  }

  return errors;
}
