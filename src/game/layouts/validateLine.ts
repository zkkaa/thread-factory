import type { LevelDefinition } from '../../levels/types';
import { ARENA_SAFE, DOCK_ZONE, LINE } from '../theme';
import type { LineLayout, Point, Rect } from './types';

const inSafe = (rect: Rect): boolean =>
  rect.x >= ARENA_SAFE.x &&
  rect.y >= ARENA_SAFE.y &&
  rect.x + rect.width <= ARENA_SAFE.x + ARENA_SAFE.width &&
  rect.y + rect.height <= ARENA_SAFE.y + ARENA_SAFE.height;

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

const ascending = (values: readonly number[]): boolean =>
  values.every((v, i) => i === 0 || v > (values[i - 1] ?? 0));

/** Kotak yang melingkupi semua lajur (dari slot pertama sampai slot terakhir). */
function laneBand(layout: LineLayout): Rect | null {
  const first = layout.slotX[0];
  const last = layout.slotX[layout.slotX.length - 1];
  if (first === undefined || last === undefined || layout.lanes.length === 0) {
    return null;
  }
  const ys = layout.lanes.map((lane) => lane.y);
  const top = Math.min(...ys) - LINE.laneHalf;
  const bottom = Math.max(...ys) + LINE.laneHalf;
  const pad = LINE.checkpointRadius;
  return {
    x: first - pad,
    y: top,
    width: last - first + pad * 2,
    height: bottom - top,
  };
}

/** Memeriksa layout lini terhadap level. Mengembalikan daftar masalah (kosong = sah). */
export function validateLineLayout(
  layout: LineLayout,
  level: LevelDefinition,
): string[] {
  const errors: string[] = [];
  const threadIds = level.threads.map((thread) => thread.id);
  const n = level.threads[0]?.program.length ?? 0;

  if (layout.id !== level.layoutId) {
    errors.push(`id layout "${layout.id}" != layoutId "${level.layoutId}"`);
  }
  if (level.threads.some((thread) => thread.program.length !== n)) {
    errors.push(
      'semua robot harus berprogram sama panjang (slot dipakai bersama)',
    );
  }

  // Lajur: satu per thread, tidak ganda, berjarak cukup.
  const laneIds = layout.lanes.map((lane) => lane.threadId);
  if (new Set(laneIds).size !== laneIds.length) {
    errors.push('id thread ganda di lajur');
  }
  if ([...laneIds].sort().join('|') !== [...threadIds].sort().join('|')) {
    errors.push('lajur harus mencakup semua thread level tepat satu kali');
  }
  const ys = layout.lanes.map((lane) => lane.y).sort((a, b) => a - b);
  ys.forEach((y, i) => {
    const prev = ys[i - 1];
    if (prev !== undefined && y - prev < LINE.minLaneGap) {
      errors.push(`jarak lajur kurang dari ${LINE.minLaneGap} px`);
    }
  });

  // Posisi x: slot k < checkpoint k < slot k+1, dengan jarak minimal.
  if (layout.checkpointX.length !== n) {
    errors.push(`checkpoint ${layout.checkpointX.length}, program ${n}`);
  }
  if (layout.slotX.length !== n + 1) {
    errors.push(`slot ${layout.slotX.length}, seharusnya ${n + 1}`);
  }
  if (!ascending(layout.checkpointX) || !ascending(layout.slotX)) {
    errors.push('urutan x checkpoint dan slot harus menaik');
  }
  for (let k = 0; k < n; k += 1) {
    const slot = layout.slotX[k];
    const cp = layout.checkpointX[k];
    const next = layout.slotX[k + 1];
    if (slot === undefined || cp === undefined || next === undefined) continue;
    if (!(slot < cp && cp < next)) {
      errors.push(
        `urutan x salah: slot ${k} < checkpoint ${k} < slot ${k + 1}`,
      );
    } else if (cp - slot < LINE.minXGap || next - cp < LINE.minXGap) {
      errors.push(
        `jarak slot dan checkpoint ${k} kurang dari ${LINE.minXGap} px`,
      );
    }
  }
  if (layout.boardLinks.some((l) => l.checkpoint < 0 || l.checkpoint >= n)) {
    errors.push('boardLinks menunjuk checkpoint yang tidak ada');
  }

  // Aula: kapasitas, gerbang, dan jangkauan.
  const { hall } = layout;
  if (level.areas?.[hall.id] === undefined) {
    errors.push(`level tidak punya area "${hall.id}"`);
  }
  const gateOk = level.threads.every((thread) => {
    const first = thread.program[hall.gate.start];
    const last = thread.program[hall.gate.end];
    return (
      first?.op === 'ENTER_AREA' &&
      first.area === hall.id &&
      last?.op === 'LEAVE_AREA' &&
      last.area === hall.id
    );
  });
  if (!gateOk) {
    errors.push(
      'gerbang harus membungkus ENTER_AREA sampai LEAVE_AREA di semua robot',
    );
  }
  const gateFrom = layout.checkpointX[hall.gate.start];
  const gateTo = layout.checkpointX[hall.gate.end];
  if (
    gateFrom !== undefined &&
    gateTo !== undefined &&
    (gateFrom < hall.zone.x || gateTo > hall.zone.x + hall.zone.width)
  ) {
    errors.push(
      'zona aula harus mencakup checkpoint ENTER_AREA sampai LEAVE_AREA',
    );
  }
  if (
    layout.lanes.some(
      (lane) => lane.y < hall.zone.y || lane.y > hall.zone.y + hall.zone.height,
    )
  ) {
    errors.push('zona aula harus mencakup semua lajur');
  }

  // Pengepak, lampu, baterai.
  if (!threadIds.includes(layout.packer.threadId)) {
    errors.push(
      `Pengepak menunjuk thread "${layout.packer.threadId}" yang tidak ada`,
    );
  }
  if (!laneIds.includes(layout.packer.threadId)) {
    errors.push('Pengepak tidak punya lajur');
  }
  if (!inRect(layout.packer.lamp, layout.packer.card)) {
    errors.push('lampu sinyal di luar kartu Pengepak');
  }
  if (!inRect(layout.packer.battery, layout.packer.card)) {
    errors.push('meter baterai di luar kartu Pengepak');
  }

  // Resource alat terdaftar di level.
  const resources = new Map(level.resources.map((r) => [r.id, r.kind]));
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

  // Tata letak: semua di area aman, di luar dok, dan tidak bertumpuk.
  const band = laneBand(layout);
  const solids: [string, Rect][] = [
    ['papan stok', layout.board],
    ['panel Pintu Kunci', layout.mutexPanel],
    ['panel Aula', layout.areaPanel],
    ['kartu Pengepak', layout.packer.card],
    ['penyimpanan', layout.storage],
    ...layout.lanes.map((lane): [string, Rect] => [
      `label lajur ${lane.threadId}`,
      lane.label,
    ]),
  ];
  const all: [string, Rect][] = [...solids, ['zona aula', hall.zone]];
  if (band !== null) all.push(['jalur robot', band]);

  for (const [name, rect] of all) {
    if (!inSafe(rect)) errors.push(`${name} di luar area aman arena`);
    if (overlaps(rect, DOCK_ZONE))
      errors.push(`${name} menimpa area dok toolbox`);
  }
  for (let i = 0; i < solids.length; i += 1) {
    for (let j = i + 1; j < solids.length; j += 1) {
      const a = solids[i];
      const b = solids[j];
      if (a !== undefined && b !== undefined && overlaps(a[1], b[1])) {
        errors.push(`${a[0]} dan ${b[0]} bertumpuk`);
      }
    }
    const item = solids[i];
    if (item === undefined) continue;
    if (band !== null && overlaps(item[1], band)) {
      errors.push(`${item[0]} bertumpuk dengan jalur robot`);
    }
    if (overlaps(item[1], hall.zone)) {
      errors.push(`${item[0]} bertumpuk dengan zona aula`);
    }
  }
  return errors;
}
