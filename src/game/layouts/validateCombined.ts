import type { LevelDefinition } from '../../levels/types';
import { ARENA, HUD_SAFE } from '../theme';
import type { CombinedLayout, Point, Rect } from './types';

const rectInSafeArea = (rect: Rect): boolean =>
  rect.x >= HUD_SAFE.x &&
  rect.y >= HUD_SAFE.y &&
  rect.x + rect.width <= HUD_SAFE.x + HUD_SAFE.width &&
  rect.y + rect.height <= HUD_SAFE.y + HUD_SAFE.height &&
  rect.x + rect.width <= ARENA.width &&
  rect.y + rect.height <= ARENA.height;

const pointInRect = (point: Point, rect: Rect): boolean =>
  point.x >= rect.x &&
  point.x <= rect.x + rect.width &&
  point.y >= rect.y &&
  point.y <= rect.y + rect.height;

const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

/** Memeriksa empat stasiun arena gabungan dan relasinya dengan level. */
export function validateCombinedLayout(
  layout: CombinedLayout,
  level: LevelDefinition,
): string[] {
  const errors: string[] = [];
  const threadIds = new Set(level.threads.map((thread) => thread.id));
  const roles = [
    layout.assembler.threadId,
    layout.warehouse.threadId,
    layout.packer.threadId,
  ];
  const zones: [string, Rect][] = [
    ['Perakit', layout.assembler.zone],
    ['Penggudang', layout.warehouse.zone],
    ['Aula', layout.area.zone],
    ['Pengepak', layout.packer.zone],
  ];

  for (const [role, threadId] of [
    ['Perakit', layout.assembler.threadId],
    ['Penggudang', layout.warehouse.threadId],
    ['Pengepak', layout.packer.threadId],
  ] as const) {
    if (!threadIds.has(threadId)) {
      errors.push(`${role} menunjuk thread "${threadId}" yang tidak ada`);
    }
  }
  if (new Set(roles).size !== roles.length) {
    errors.push('setiap peran harus memakai thread yang berbeda');
  }
  const roadBounds: Rect = {
    x: layout.road.left,
    y: layout.road.top,
    width: layout.road.width,
    height: layout.road.height,
  };
  for (const [name, zone] of zones) {
    if (!rectInSafeArea(zone)) {
      errors.push(`zona ${name} di luar area aman HUD`);
    }
    if (overlaps(zone, roadBounds)) {
      errors.push(`zona ${name} bertumpuk dengan jalur robot`);
    }
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

  const capacity = level.areas?.[layout.area.id];
  if (capacity === undefined) {
    errors.push(`level tidak punya area "${layout.area.id}"`);
  } else if (layout.area.machines.length !== capacity) {
    errors.push(
      `mesin ${layout.area.machines.length}, kapasitas area ${capacity}`,
    );
  }
  if (
    layout.area.machines.some(
      (machine) => !pointInRect(machine, layout.area.zone),
    )
  ) {
    errors.push('posisi mesin di luar zona aula');
  }
  if (!pointInRect(layout.area.door, layout.area.zone)) {
    errors.push('pintu Kartu Akses di luar zona aula');
  }
  const firstGateInstruction =
    level.threads[0]?.program[layout.area.gate.start];
  const lastGateInstruction = level.threads[0]?.program[layout.area.gate.end];
  if (
    firstGateInstruction?.op !== 'ENTER_AREA' ||
    firstGateInstruction.area !== layout.area.id ||
    lastGateInstruction?.op !== 'LEAVE_AREA' ||
    lastGateInstruction.area !== layout.area.id
  ) {
    errors.push(
      'gerbang Kartu Akses harus membungkus ENTER_AREA dan LEAVE_AREA',
    );
  }
  const resources = new Map(
    level.resources.map((resource) => [resource.id, resource.kind]),
  );
  if (resources.get(layout.tools.mutexId) !== 'mutex') {
    errors.push(`mutex "${layout.tools.mutexId}" tidak terdaftar di level`);
  }
  if (resources.get(layout.tools.semaphoreId) !== 'semaphore') {
    errors.push(
      `semaphore "${layout.tools.semaphoreId}" tidak terdaftar di level`,
    );
  }
  if (resources.get(layout.tools.conditionId) !== 'condition') {
    errors.push(
      `condition variable "${layout.tools.conditionId}" tidak terdaftar di level`,
    );
  }
  if (!pointInRect(layout.packer.lamp, layout.packer.zone)) {
    errors.push('lampu sinyal di luar zona pengepak');
  }
  if (!pointInRect(layout.packer.battery, layout.packer.zone)) {
    errors.push('meter baterai di luar zona pengepak');
  }

  return errors;
}
