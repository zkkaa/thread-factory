import type { Instruction, ThreadDef, ThreadSnapshot } from '../engine/types';
import type { HallLayout, Point } from './layouts/types';

/**
 * Zona tempat robot digambar di arena aula.
 * - work : mengerjakan WORK di luar aula
 * - door : sudah memegang kartu (lewat SEM_WAIT), tinggal masuk
 * - queue: menunggu kartu (WAITING)
 * - hall : di dalam aula (antara ENTER_AREA dan LEAVE_AREA)
 * - done : seluruh pengulangan selesai (TERMINATED)
 */
export type HallZone = 'work' | 'door' | 'queue' | 'hall' | 'done';

export interface HallRobot {
  id: string;
  /** Urutan thread di snapshot; menentukan titik kerja dan titik selesai. */
  index: number;
  zone: HallZone;
}

/**
 * Menurunkan zona dari program EFEKTIF (sudah berisi SEM_WAIT/SEM_SIGNAL
 * sisipan) dan keadaan thread. `pc` menunjuk instruksi berikutnya, jadi robot
 * di dalam aula selama ENTER_AREA < pc <= LEAVE_AREA; ini sama dengan keanggotaan
 * area di engine. Fungsi murni.
 */
export function zoneOf(
  program: readonly Instruction[],
  thread: ThreadSnapshot,
  area: string,
): HallZone {
  if (thread.state === 'TERMINATED') return 'done';
  if (thread.state === 'WAITING') return 'queue';

  const enter = program.findIndex(
    (ins) => ins.op === 'ENTER_AREA' && ins.area === area,
  );
  const leave = program.findIndex(
    (ins) => ins.op === 'LEAVE_AREA' && ins.area === area,
  );
  if (enter < 0 || leave <= enter) return 'work';

  if (thread.pc > enter && thread.pc <= leave) return 'hall';
  if (thread.pc === enter && program[enter - 1]?.op === 'SEM_WAIT') {
    return 'door';
  }
  return 'work';
}

/** Zona semua robot dari program efektif dan snapshot thread. */
export function hallRobots(
  effective: readonly ThreadDef[],
  threads: readonly ThreadSnapshot[],
  area: string,
): HallRobot[] {
  return threads.map((thread, index) => {
    const program = effective.find((def) => def.id === thread.id)?.program;
    return { id: thread.id, index, zone: zoneOf(program ?? [], thread, area) };
  });
}

/**
 * Memilih kursi di aula (0 sampai seatCount-1; kursi awal = mesin, sisanya
 * luapan). Robot yang masih di dalam mempertahankan kursinya dari
 * `previous` supaya tidak berpindah mesin; yang baru masuk mengisi kursi
 * kosong terkecil. Bila robot melebihi kursi, sisanya berbagi kursi terakhir.
 * `inside` harus berurutan menurut indeks thread. Fungsi murni.
 */
export function seatInHall(
  inside: readonly string[],
  previous: ReadonlyMap<string, number>,
  seatCount: number,
): Map<string, number> {
  const seats = new Map<string, number>();
  if (seatCount <= 0) return seats;

  const taken = new Set<number>();
  for (const id of inside) {
    const before = previous.get(id);
    if (before !== undefined && before < seatCount && !taken.has(before)) {
      seats.set(id, before);
      taken.add(before);
    }
  }

  let next = 0;
  for (const id of inside) {
    if (seats.has(id)) continue;
    while (next < seatCount && taken.has(next)) next += 1;
    const seat = Math.min(next, seatCount - 1);
    seats.set(id, seat);
    taken.add(seat);
    next = seat + 1;
  }
  return seats;
}

function pick(spots: readonly Point[], index: number, name: string): Point {
  const spot = spots[Math.min(index, spots.length - 1)];
  if (spot === undefined) {
    throw new Error(`Layout aula tidak punya titik ${name}`);
  }
  return spot;
}

/**
 * Titik layar tiap robot menurut zonanya.
 * - work dan done: titik tetap menurut indeks thread.
 * - antrean: robot di depan pintu dulu, lalu yang menunggu menurut
 *   `waitingOrder` (antrean FIFO semaphore); yang tidak tercantum di belakang.
 * - aula: kursi lengket (lihat seatInHall).
 * `seats` dikembalikan agar dipakai lagi sebagai `previousSeats` pada pemanggilan
 * berikutnya. Fungsi murni.
 */
export function assignHallSpots(
  layout: HallLayout,
  robots: readonly HallRobot[],
  waitingOrder: readonly string[],
  previousSeats: ReadonlyMap<string, number>,
): { spots: Map<string, Point>; seats: Map<string, number> } {
  const spots = new Map<string, Point>();
  const byIndex = (a: HallRobot, b: HallRobot): number => a.index - b.index;

  for (const robot of robots) {
    if (robot.zone === 'work') {
      spots.set(robot.id, pick(layout.workSpots, robot.index, 'kerja'));
    } else if (robot.zone === 'done') {
      spots.set(robot.id, pick(layout.doneSpots, robot.index, 'selesai'));
    }
  }

  const rank = new Map(waitingOrder.map((id, position) => [id, position]));
  const unknown = waitingOrder.length;
  const atDoor = robots.filter((r) => r.zone === 'door').sort(byIndex);
  const waiting = robots
    .filter((r) => r.zone === 'queue')
    .sort(
      (a, b) =>
        (rank.get(a.id) ?? unknown) - (rank.get(b.id) ?? unknown) ||
        byIndex(a, b),
    );
  [...atDoor, ...waiting].forEach((robot, place) => {
    spots.set(robot.id, pick(layout.queueSpots, place, 'antrean'));
  });

  const inside = robots
    .filter((r) => r.zone === 'hall')
    .sort(byIndex)
    .map((r) => r.id);
  const seatSpots = [...layout.machines, ...layout.overflowSpots];
  const seats = seatInHall(inside, previousSeats, seatSpots.length);
  for (const [id, seat] of seats) {
    spots.set(id, pick(seatSpots, seat, 'aula'));
  }

  return { spots, seats };
}
