import type { LevelDefinition } from '../../levels/types';
import { ARENA, HALL, TOKEN_PANEL } from '../theme';
import type { HallLayout, Point, Rect } from './types';

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

const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

/** Jarak terkecil antara dua titik mana pun (Infinity bila titiknya kurang dari dua). */
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

/** Memeriksa layout aula terhadap level. Mengembalikan daftar masalah (kosong = sah). */
export function validateHallLayout(
  layout: HallLayout,
  level: LevelDefinition,
): string[] {
  const errors: string[] = [];
  const robots = level.threads.length;
  const program = level.threads[0]?.program ?? [];

  if (layout.id !== level.layoutId) {
    errors.push(`id layout "${layout.id}" != layoutId "${level.layoutId}"`);
  }

  const capacity = level.areas?.[layout.area];
  if (capacity === undefined) {
    errors.push(`level tidak punya area "${layout.area}"`);
  } else if (layout.machines.length !== capacity) {
    errors.push(`mesin ${layout.machines.length}, kapasitas area ${capacity}`);
  }

  if (layout.workSpots.length !== robots) {
    errors.push(`titik kerja ${layout.workSpots.length}, robot ${robots}`);
  }
  if (layout.doneSpots.length !== robots) {
    errors.push(`titik selesai ${layout.doneSpots.length}, robot ${robots}`);
  }
  if (layout.queueSpots.length < robots) {
    errors.push(`titik antrean ${layout.queueSpots.length}, minimal ${robots}`);
  }
  const seatsNeeded = robots - layout.machines.length;
  if (layout.overflowSpots.length < seatsNeeded) {
    errors.push(
      `titik luapan ${layout.overflowSpots.length}, minimal ${seatsNeeded}`,
    );
  }

  const first = program[layout.gate.start];
  const last = program[layout.gate.end];
  const gateOk =
    first?.op === 'ENTER_AREA' &&
    first.area === layout.area &&
    last?.op === 'LEAVE_AREA' &&
    last.area === layout.area;
  if (!gateOk) {
    errors.push('gerbang harus dari ENTER_AREA sampai LEAVE_AREA');
  }

  const zones: [string, Rect][] = [
    ['kerja', layout.workZone],
    ['antrean', layout.queueZone],
    ['aula', layout.hall],
    ['selesai', layout.doneZone],
  ];
  for (const [name, rect] of zones) {
    if (!rectInArena(rect)) errors.push(`zona ${name} di luar ARENA`);
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

  const groups: [string, readonly Point[], Rect][] = [
    ['kerja', layout.workSpots, layout.workZone],
    ['antrean', layout.queueSpots, layout.queueZone],
    ['mesin', layout.machines, layout.hall],
    ['luapan', layout.overflowSpots, layout.hall],
    ['selesai', layout.doneSpots, layout.doneZone],
  ];
  for (const [name, spots, rect] of groups) {
    if (spots.some((p) => !inRect(p, rect))) {
      errors.push(`titik ${name} di luar zonanya`);
    }
  }

  const gap = HALL.minSpotGap;
  const spacing: [string, readonly Point[]][] = [
    ['kerja', layout.workSpots],
    ['antrean', layout.queueSpots],
    ['aula', [...layout.machines, ...layout.overflowSpots]],
    ['selesai', layout.doneSpots],
  ];
  for (const [name, spots] of spacing) {
    if (smallestGap(spots) < gap) {
      errors.push(`titik ${name} terlalu rapat (minimal ${gap} px)`);
    }
  }

  const { door, hall } = layout;
  if (door.x !== hall.x || door.y <= hall.y || door.y >= hall.y + hall.height) {
    errors.push('pintu aula harus di tepi kiri aula');
  }

  const rack: Rect = {
    x: layout.tokenRack.x - TOKEN_PANEL.width / 2,
    y: layout.tokenRack.y - TOKEN_PANEL.height / 2,
    width: TOKEN_PANEL.width,
    height: TOKEN_PANEL.height,
  };
  if (!rectInArena(rack)) errors.push('rak kartu di luar ARENA');
  for (const [name, rect] of zones) {
    if (overlaps(rack, rect)) errors.push(`rak kartu menimpa zona ${name}`);
  }

  return errors;
}
