import type { LevelDefinition } from '../../levels/types';
import { ARENA, SLOT_STYLE } from '../theme';
import type { HallLayout } from './hallLayoutTypes';
import type { Point } from './types';

const inArena = (p: Point): boolean =>
  p.x >= 0 && p.x <= ARENA.width && p.y >= 0 && p.y <= ARENA.height;

/**
 * Memeriksa layout aula terhadap level. Mengembalikan daftar masalah
 * (kosong = sah). Dipanggil dari validateLayout bila layout.kind === 'hall'.
 */
export function validateHallLayout(
  layout: HallLayout,
  level: LevelDefinition,
): string[] {
  const errors: string[] = [];
  const robots = level.threads.length;
  const n = level.threads[0]?.program.length ?? 0;

  if (layout.id !== level.layoutId) {
    errors.push(`id layout "${layout.id}" != layoutId "${level.layoutId}"`);
  }
  if (layout.slots.length !== n + 1) {
    errors.push(`slot ${layout.slots.length}, seharusnya ${n + 1}`);
  }
  if (!layout.slots.every(inArena)) errors.push('slot di luar ARENA');

  // Slot yang terlalu dekat membuat lepas-seret ambigu.
  for (let i = 0; i < layout.slots.length; i++) {
    for (let j = i + 1; j < layout.slots.length; j++) {
      const a = layout.slots[i];
      const b = layout.slots[j];
      if (a === undefined || b === undefined) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) < SLOT_STYLE.hitRadius) {
        errors.push(`slot ${i} dan ${j} terlalu dekat`);
      }
    }
  }

  if (layout.prepSpots.length < robots) {
    errors.push(`prepSpots ${layout.prepSpots.length}, robot ${robots}`);
  }
  if (!layout.prepSpots.every(inArena)) errors.push('prepSpots di luar ARENA');

  // Tiap robot harus ada di tepat satu lajur.
  const seen = new Map<number, number>();
  for (const lane of layout.lanes) {
    for (const robot of lane.robots) {
      seen.set(robot, (seen.get(robot) ?? 0) + 1);
    }
    if (lane.queueSpots.length < lane.robots.length) {
      errors.push(
        `lajur y=${lane.y}: antrean ${lane.queueSpots.length}, robot ${lane.robots.length}`,
      );
    }
    if (!lane.queueSpots.every(inArena) || !inArena(lane.turn)) {
      errors.push(`lajur y=${lane.y} di luar ARENA`);
    }
  }
  for (let robot = 0; robot < robots; robot++) {
    if (seen.get(robot) !== 1) {
      errors.push(`robot ${robot} harus ada di tepat satu lajur`);
    }
  }

  const capacity = Object.values(level.areas ?? {})[0];
  const needed = Math.max(robots, capacity ?? 0);
  if (capacity === undefined) {
    errors.push('level tidak punya area berkapasitas');
  }
  if (layout.areaSpots.length < needed) {
    errors.push(`areaSpots ${layout.areaSpots.length} < ${needed}`);
  }
  if (!layout.areaSpots.every(inArena)) errors.push('areaSpots di luar ARENA');

  for (const [name, point] of [
    ['exitSpot', layout.exitSpot],
    ['gate', layout.gate],
    ['merge', layout.merge],
  ] as const) {
    if (!inArena(point)) errors.push(`${name} di luar ARENA`);
  }
  const { x, y, width, height } = layout.areaBox;
  if (!inArena({ x, y }) || !inArena({ x: x + width, y: y + height })) {
    errors.push('areaBox di luar ARENA');
  }
  if (layout.art.gate.lamps.length !== 3) {
    errors.push('gerbang butuh tepat 3 titik lampu');
  }
  return errors;
}