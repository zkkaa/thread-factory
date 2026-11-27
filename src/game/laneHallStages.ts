import type { InstructionOrigin } from '../engine/tools';
import type { Instruction, ThreadId, ThreadSnapshot } from '../engine/types';
import type { LaneHallLayout, Point } from './layouts/types';

/**
 * Logika murni arena aula (Level 1-3): robot ada di tahap mana, berdiri di
 * tempat yang mana, dan lewat mana saat pindah. Tidak mengenal Phaser; view
 * hanya menggambar hasilnya.
 *
 * Tahap ditentukan dari `pc` (instruksi berikutnya) pada program EFEKTIF,
 * sehingga kebenaran visual mengikuti engine: robot yang menunggu SEM_WAIT
 * yang dipasang di dalam area (slot 2 atau 3) memang tampak di dalam area,
 * karena ENTER_AREA sudah dieksekusi dan ia ikut dihitung sebagai penghuni.
 */
export type HallStage = 'prep' | 'queue' | 'area' | 'exit' | 'done';

/** Indeks instruksi efektif yang menandai batas antar tahap. */
export interface StageMarks {
  /** WORK terakhir sebelum ENTER_AREA; -1 bila tidak ada. */
  workIdx: number;
  enterIdx: number;
  leaveIdx: number;
}

/**
 * Mencari penanda tahap dari program asli dan peta asal instruksi.
 * null bila program tidak punya pasangan ENTER_AREA ... LEAVE_AREA.
 */
export function stageMarks(
  original: readonly Instruction[],
  origins: readonly InstructionOrigin[],
): StageMarks | null {
  const enterOrig = original.findIndex((i) => i.op === 'ENTER_AREA');
  const leaveOrig = original.findIndex((i) => i.op === 'LEAVE_AREA');
  if (enterOrig < 0 || leaveOrig < enterOrig) return null;

  let workOrig = -1;
  for (let i = 0; i < enterOrig; i++) {
    if (original[i]?.op === 'WORK') workOrig = i;
  }
  const effective = (index: number): number =>
    origins.findIndex((o) => o.kind === 'original' && o.index === index);

  const enterIdx = effective(enterOrig);
  const leaveIdx = effective(leaveOrig);
  if (enterIdx < 0 || leaveIdx < 0) return null;
  return {
    workIdx: workOrig < 0 ? -1 : effective(workOrig),
    enterIdx,
    leaveIdx,
  };
}

export function stageOf(
  thread: Pick<ThreadSnapshot, 'state' | 'pc'>,
  marks: StageMarks,
): HallStage {
  if (thread.state === 'TERMINATED') return 'done';
  const { pc } = thread;
  // pc = instruksi berikutnya: pc di ENTER_AREA berarti belum masuk,
  // pc di LEAVE_AREA berarti belum keluar.
  if (pc > marks.enterIdx && pc <= marks.leaveIdx) return 'area';
  if (pc > marks.leaveIdx) return 'exit';
  if (pc > marks.workIdx) return 'queue';
  return 'prep';
}

/** Lajur milik robot ke-`order`; 0 bila tidak terdaftar. */
export function laneOf(layout: LaneHallLayout, order: number): number {
  const lane = layout.lanes.findIndex((l) => l.robots.includes(order));
  return lane < 0 ? 0 : lane;
}

/** Satu tempat berdiri: indeks pada daftar tempat tahapnya, dan lajur robot. */
export interface SpotRef {
  stage: HallStage;
  index: number;
  lane: number;
}

/**
 * Menentukan tempat tiap robot.
 * - prep dan done: pijakan tetap menurut urutan robot.
 * - queue: per lajur; yang menunggu semaphore berbaris sesuai antrean FIFO
 *   engine (indeks 0 paling dekat gerbang), lalu sisanya menurut urutan robot.
 * - area: robot yang sudah di dalam tidak berpindah tempat; pendatang baru
 *   mengisi tempat kosong terkecil. `previous` = hasil pemanggilan sebelumnya.
 */
export function assignSpots(
  layout: LaneHallLayout,
  threads: readonly Pick<ThreadSnapshot, 'id'>[],
  stages: ReadonlyMap<ThreadId, HallStage>,
  semaphoreQueue: readonly ThreadId[],
  previous: ReadonlyMap<ThreadId, SpotRef>,
): Map<ThreadId, SpotRef> {
  const result = new Map<ThreadId, SpotRef>();
  const ids = threads.map((t) => t.id);
  const orderOf = new Map(ids.map((id, order) => [id, order]));
  const laneFor = (id: ThreadId): number =>
    laneOf(layout, orderOf.get(id) ?? 0);

  ids.forEach((id, order) => {
    const stage = stages.get(id) ?? 'prep';
    const lane = laneFor(id);
    if (stage === 'prep' || stage === 'done') {
      result.set(id, { stage, index: order, lane });
    } else if (stage === 'exit') {
      result.set(id, { stage, index: 0, lane });
    }
  });

  const inQueue = ids.filter((id) => stages.get(id) === 'queue');
  const waiting = semaphoreQueue.filter((id) => inQueue.includes(id));
  const rest = inQueue.filter((id) => !waiting.includes(id));
  const rankInLane = new Map<number, number>();
  for (const id of [...waiting, ...rest]) {
    const lane = laneFor(id);
    const rank = rankInLane.get(lane) ?? 0;
    rankInLane.set(lane, rank + 1);
    result.set(id, { stage: 'queue', index: rank, lane });
  }

  const inArea = ids.filter((id) => stages.get(id) === 'area');
  const taken = new Set<number>();
  for (const id of inArea) {
    const before = previous.get(id);
    if (
      before?.stage === 'area' &&
      before.index < layout.areaSpots.length &&
      !taken.has(before.index)
    ) {
      taken.add(before.index);
      result.set(id, { ...before, lane: laneFor(id) });
    }
  }
  let next = 0;
  for (const id of inArea) {
    if (result.has(id)) continue;
    while (taken.has(next)) next += 1;
    taken.add(next);
    result.set(id, { stage: 'area', index: next, lane: laneFor(id) });
  }
  return result;
}

/** Titik kanvas sebuah tempat; indeks di luar daftar dipotong ke tempat terakhir. */
export function spotPoint(layout: LaneHallLayout, ref: SpotRef): Point {
  let list: readonly Point[];
  switch (ref.stage) {
    case 'prep':
    case 'done':
      list = layout.prepSpots;
      break;
    case 'queue':
      list = layout.lanes[ref.lane]?.queueSpots ?? [];
      break;
    case 'area':
      list = layout.areaSpots;
      break;
    case 'exit':
      list = [layout.exitSpot];
      break;
  }
  const point = list[Math.min(ref.index, list.length - 1)];
  if (point === undefined) throw new Error(`Tahap ${ref.stage} tanpa tempat.`);
  return point;
}

/**
 * Robot yang keluar lalu kembali ke pijakan (atau parkir sebagai selesai)
 * tidak berjalan: view memudarkannya lalu memunculkannya di tujuan.
 */
export function isRespawn(from: HallStage, to: HallStage): boolean {
  return (
    (from === 'area' || from === 'exit') && (to === 'prep' || to === 'done')
  );
}

/**
 * Titik yang dilewati robot ke-`order` saat pindah tahap, berakhir di `dest`.
 * Dari pijakan: ke sumbu tegak, naik atau turun ke lajurnya. Ke dalam: lewat
 * gerbang, belok, bergabung. Perpindahan respawn mengembalikan hanya `dest`.
 */
export function routeBetween(
  layout: LaneHallLayout,
  order: number,
  from: HallStage,
  to: HallStage,
  dest: Point,
): Point[] {
  const lane = layout.lanes[laneOf(layout, order)];
  const prep = layout.prepSpots[order];
  if (lane === undefined || isRespawn(from, to)) return [dest];

  const via: Point[] = [];
  const inside = to === 'area' || to === 'exit';
  if (from === 'prep' && prep !== undefined && (to === 'queue' || inside)) {
    via.push(
      { x: layout.spineX, y: prep.y },
      { x: layout.spineX, y: lane.y },
    );
    if (inside) {
      via.push({ x: layout.gate.x, y: lane.y }, lane.turn, layout.merge);
    }
  } else if (from === 'queue' && inside) {
    via.push({ x: layout.gate.x, y: lane.y }, lane.turn, layout.merge);
  }
  return [...via, dest];
}