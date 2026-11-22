import type { LevelDefinition } from '../../levels/types';
import { ARENA, HALL, HUD_SAFE } from '../theme';
import type { FlowLayout, Point, Rect } from './types';

const rectInArena = (r: Rect): boolean =>
  r.x >= 0 &&
  r.y >= 0 &&
  r.x + r.width <= ARENA.width &&
  r.y + r.height <= ARENA.height;

const rectInSafe = (r: Rect): boolean =>
  r.x >= HUD_SAFE.x &&
  r.y >= HUD_SAFE.y &&
  r.x + r.width <= HUD_SAFE.x + HUD_SAFE.width &&
  r.y + r.height <= HUD_SAFE.y + HUD_SAFE.height;

const inRect = (p: Point, r: Rect): boolean =>
  p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height;

const rectInside = (inner: Rect, outer: Rect): boolean =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width &&
  inner.y + inner.height <= outer.y + outer.height;

const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

/** Jarak terkecil antara dua titik mana pun (Infinity bila kurang dari dua titik). */
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

/** Memeriksa layout alur terhadap level. Mengembalikan daftar masalah (kosong = sah). */
export function validateFlowLayout(
  layout: FlowLayout,
  level: LevelDefinition,
): string[] {
  const errors: string[] = [];
  const assemblers = level.threads.filter((t) => t.id !== layout.packerId);
  const robots = assemblers.length;
  const program = assemblers[0]?.program ?? [];

  if (layout.id !== level.layoutId) {
    errors.push(`id layout "${layout.id}" != layoutId "${level.layoutId}"`);
  }
  if (!level.threads.some((t) => t.id === layout.packerId)) {
    errors.push(`pengepak "${layout.packerId}" tidak ada di level`);
  }
  if (assemblers.some((t) => t.program.length !== program.length)) {
    errors.push('semua perakit harus berprogram sama panjang');
  }

  const capacity = level.areas?.[layout.area];
  if (capacity === undefined) {
    errors.push(`level tidak punya area "${layout.area}"`);
  } else if (layout.machines.length !== capacity) {
    errors.push(`mesin ${layout.machines.length}, kapasitas area ${capacity}`);
  }

  const enter = program[layout.hallSpan.start];
  const leave = program[layout.hallSpan.end];
  if (
    enter?.op !== 'ENTER_AREA' ||
    enter.area !== layout.area ||
    leave?.op !== 'LEAVE_AREA' ||
    leave.area !== layout.area
  ) {
    errors.push('hallSpan harus dari ENTER_AREA sampai LEAVE_AREA');
  }
  if (
    program[layout.stockSpan.start]?.op !== 'READ' ||
    program[layout.stockSpan.end]?.op !== 'WRITE'
  ) {
    errors.push('stockSpan harus dari READ sampai WRITE');
  }

  const kinds = new Map(level.resources.map((r) => [r.id, r.kind]));
  if (kinds.get(layout.tools.mutexId) !== 'mutex') {
    errors.push(`mutex "${layout.tools.mutexId}" tidak terdaftar di level`);
  }
  if (kinds.get(layout.tools.semaphoreId) !== 'semaphore') {
    errors.push(
      `semaphore "${layout.tools.semaphoreId}" tidak terdaftar di level`,
    );
  }
  if (kinds.get(layout.tools.conditionId) !== 'condition') {
    errors.push(
      `condition "${layout.tools.conditionId}" tidak terdaftar di level`,
    );
  }

  const minimum: [string, number, number][] = [
    ['titik kerja', layout.workSpots.length, robots],
    ['titik selesai', layout.doneSpots.length, robots],
    ['antrean aula', layout.hallQueueSpots.length, robots],
    ['luapan aula', layout.overflowSpots.length, robots - layout.machines.length],
    ['antrean mutex', layout.stockQueueSpots.length, robots - 1],
    ['titik area kritis', layout.stockSpots.length, robots],
  ];
  for (const [name, have, need] of minimum) {
    if (have < need) errors.push(`${name} ${have}, minimal ${need}`);
  }

  const zones: [string, Rect][] = [
    ['kerja', layout.workZone],
    ['aula', layout.hallZone],
    ['papan stok', layout.stockZone],
    ['pengepak', layout.packZone],
    ['selesai', layout.doneZone],
  ];
  for (const [name, rect] of zones) {
    if (!rectInArena(rect)) errors.push(`zona ${name} di luar ARENA`);
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

  const groups: [string, readonly Point[], Rect][] = [
    ['kerja', layout.workSpots, layout.workZone],
    ['antrean aula', layout.hallQueueSpots, layout.hallZone],
    ['mesin', layout.machines, layout.hallZone],
    ['luapan aula', layout.overflowSpots, layout.hallZone],
    ['pintu aula', [layout.hallDoor], layout.hallZone],
    ['antrean mutex', layout.stockQueueSpots, layout.stockZone],
    ['area kritis', layout.stockSpots, layout.stockZone],
    ['gerbang mutex', [layout.stockDoor], layout.stockZone],
    ['pengepak', [layout.packerSpot, layout.lamp, layout.battery], layout.packZone],
    ['selesai', layout.doneSpots, layout.doneZone],
  ];
  for (const [name, spots, rect] of groups) {
    if (spots.some((p) => !inRect(p, rect))) {
      errors.push(`titik ${name} di luar zonanya`);
    }
  }
  if (!rectInside(layout.stockBoard, layout.stockZone)) {
    errors.push('papan stok di luar zona papan stok');
  }

  const spacing: [string, readonly Point[]][] = [
    ['kerja', layout.workSpots],
    ['aula', [...layout.hallQueueSpots, ...layout.machines, ...layout.overflowSpots]],
    ['papan stok', [...layout.stockQueueSpots, ...layout.stockSpots]],
    ['selesai', layout.doneSpots],
  ];
  for (const [name, spots] of spacing) {
    if (smallestGap(spots) < HALL.minSpotGap) {
      errors.push(`titik ${name} terlalu rapat (minimal ${HALL.minSpotGap} px)`);
    }
  }

  return errors;
}