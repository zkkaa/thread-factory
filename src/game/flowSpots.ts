import type { Instruction, ThreadDef, ThreadSnapshot } from '../engine/types';
import { seatInHall } from './hallSpots';
import type { FlowLayout, Point } from './layouts/types';

/**
 * Zona tempat perakit digambar di arena alur.
 * - work      : merakit di zona A (termasuk menunggu giliran WORK)
 * - hallQueue : menunggu atau sudah memegang kartu, belum masuk aula
 * - hall      : di dalam aula (antara ENTER_AREA dan LEAVE_AREA)
 * - stockQueue: menunggu pintu mutex papan stok
 * - stock     : di zona papan stok (sudah lewat aula, belum selesai putaran)
 * - done      : seluruh pengulangan selesai
 */
export type FlowZone =
  'work' | 'hallQueue' | 'hall' | 'stockQueue' | 'stock' | 'done';

export interface FlowRobot {
  id: string;
  /** Urutan di antara perakit (pengepak tidak dihitung). */
  index: number;
  zone: FlowZone;
}

/**
 * Menurunkan zona dari program EFEKTIF (sudah berisi sisipan alat) dan keadaan
 * thread. `pc` menunjuk instruksi berikutnya. Fungsi murni; tidak ada aturan
 * permainan di sini, hanya cara membaca posisi robot dari state engine.
 */
export function flowZoneOf(
  program: readonly Instruction[],
  thread: ThreadSnapshot,
  area: string,
): FlowZone {
  if (thread.state === 'TERMINATED') return 'done';
  if (thread.state === 'WAITING') {
    return thread.waitingOn?.startsWith('sem:') === true
      ? 'hallQueue'
      : 'stockQueue';
  }

  const enter = program.findIndex(
    (ins) => ins.op === 'ENTER_AREA' && ins.area === area,
  );
  const leave = program.findIndex(
    (ins) => ins.op === 'LEAVE_AREA' && ins.area === area,
  );
  if (enter < 0 || leave <= enter) return 'work';

  if (thread.pc > enter && thread.pc <= leave) return 'hall';
  if (thread.pc === enter && program[enter - 1]?.op === 'SEM_WAIT') {
    return 'hallQueue';
  }
  if (thread.pc > leave) return 'stock';
  return 'work';
}

/** Zona semua perakit (pengepak dilewati). */
export function flowRobots(
  effective: readonly ThreadDef[],
  threads: readonly ThreadSnapshot[],
  area: string,
  packerId: string,
): FlowRobot[] {
  return threads
    .filter((thread) => thread.id !== packerId)
    .map((thread, index) => {
      const program = effective.find((def) => def.id === thread.id)?.program;
      return {
        id: thread.id,
        index,
        zone: flowZoneOf(program ?? [], thread, area),
      };
    });
}

export interface FlowSeats {
  hall: ReadonlyMap<string, number>;
  stock: ReadonlyMap<string, number>;
}

export interface FlowPlacement {
  spots: Map<string, Point>;
  /** Kursi lengket; berikan lagi sebagai `previous` pada pemanggilan berikutnya. */
  seats: FlowSeats;
}

function pick(spots: readonly Point[], index: number, name: string): Point {
  const spot = spots[Math.min(index, spots.length - 1)];
  if (spot === undefined) {
    throw new Error(`Layout alur tidak punya titik ${name}`);
  }
  return spot;
}

/**
 * Mengurutkan antrean: yang tidak ada di `waiting` (mis. sudah memegang kartu,
 * tinggal masuk) paling depan, lalu yang menunggu menurut urutan antrean
 * primitif (FIFO), sisanya menurut indeks.
 */
function orderQueue(
  group: readonly FlowRobot[],
  waiting: readonly string[],
): FlowRobot[] {
  const rank = new Map(waiting.map((id, place) => [id, place]));
  const key = (robot: FlowRobot): number => rank.get(robot.id) ?? -1;
  return [...group].sort((a, b) => key(a) - key(b) || a.index - b.index);
}

/**
 * Titik layar tiap perakit menurut zonanya.
 * - work dan done: titik tetap menurut indeks perakit.
 * - antrean aula dan antrean mutex: urutan antrean, indeks 0 paling dekat pintu.
 * - aula (mesin lalu luapan) dan area kritis: kursi lengket (seatInHall),
 *   sehingga robot yang masih di dalam tidak berpindah titik.
 * Bila robot melebihi titik, sisanya berbagi titik terakhir. Fungsi murni.
 */
export function assignFlowSpots(
  layout: FlowLayout,
  robots: readonly FlowRobot[],
  hallWaiting: readonly string[],
  stockWaiting: readonly string[],
  previous: FlowSeats,
): FlowPlacement {
  const spots = new Map<string, Point>();
  const inZone = (zone: FlowZone): FlowRobot[] =>
    robots.filter((r) => r.zone === zone).sort((a, b) => a.index - b.index);

  for (const robot of inZone('work')) {
    spots.set(robot.id, pick(layout.workSpots, robot.index, 'kerja'));
  }
  for (const robot of inZone('done')) {
    spots.set(robot.id, pick(layout.doneSpots, robot.index, 'selesai'));
  }

  orderQueue(inZone('hallQueue'), hallWaiting).forEach((robot, place) => {
    spots.set(robot.id, pick(layout.hallQueueSpots, place, 'antrean aula'));
  });
  orderQueue(inZone('stockQueue'), stockWaiting).forEach((robot, place) => {
    spots.set(robot.id, pick(layout.stockQueueSpots, place, 'antrean mutex'));
  });

  const hallSpots = [...layout.machines, ...layout.overflowSpots];
  const hallSeats = seatInHall(
    inZone('hall').map((r) => r.id),
    previous.hall,
    hallSpots.length,
  );
  for (const [id, seat] of hallSeats) {
    spots.set(id, pick(hallSpots, seat, 'aula'));
  }

  const stockSeats = seatInHall(
    inZone('stock').map((r) => r.id),
    previous.stock,
    layout.stockSpots.length,
  );
  for (const [id, seat] of stockSeats) {
    spots.set(id, pick(layout.stockSpots, seat, 'area kritis'));
  }

  return { spots, seats: { hall: hallSeats, stock: stockSeats } };
}
