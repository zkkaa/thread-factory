import { describe, expect, it } from 'vitest';
import { buildEngineConfig } from '../../controller/buildEngineConfig';
import { Engine } from '../../engine/engine';
import { applyTools, type PlacedTool } from '../../engine/tools';
import type { ThreadSnapshot, ThreadState } from '../../engine/types';
import { level1_3 } from '../../levels/module1/level-1-3';
import {
  assignHallSpots,
  hallRobots,
  seatInHall,
  zoneOf,
  type HallRobot,
  type HallZone,
} from '../hallSpots';
import { hall1_3 } from '../layouts/level-1-3.hall.layout';

const AREA = hall1_3.area;

/** Gerbang Kartu Akses yang menutupi ENTER_AREA sampai LEAVE_AREA. */
function cardGate(value: number): PlacedTool {
  return {
    id: 'sem-kartu',
    kind: 'semaphore',
    sem: 'kartu',
    value,
    spans: level1_3.threads.map((t) => ({
      thread: t.id,
      start: hall1_3.gate.start,
      end: hall1_3.gate.end,
    })),
  };
}

function programOf(tools: PlacedTool[]) {
  return applyTools(level1_3.threads, tools)[0]?.program ?? [];
}

function thread(id: string, state: ThreadState, pc: number): ThreadSnapshot {
  return {
    id,
    label: `Robot ${id}`,
    state,
    pc,
    iteration: 0,
    registers: {},
    waitingOn: null,
    workRemaining: 0,
    waitTicks: 0,
  };
}

function robots(zones: HallZone[]): HallRobot[] {
  return zones.map((zone, index) => ({ id: `R${index + 1}`, index, zone }));
}

describe('zoneOf', () => {
  const gated = programOf([cardGate(3)]);
  // [WORK, SEM_WAIT, ENTER_AREA, WORK, LEAVE_AREA, SEM_SIGNAL]

  it('dengan gerbang: zona menurut pc dan state', () => {
    expect(zoneOf(gated, thread('R1', 'NEW', 0), AREA)).toBe('work');
    expect(zoneOf(gated, thread('R1', 'READY', 0), AREA)).toBe('work');
    expect(zoneOf(gated, thread('R1', 'WAITING', 1), AREA)).toBe('queue');
    expect(zoneOf(gated, thread('R1', 'READY', 2), AREA)).toBe('door');
    expect(zoneOf(gated, thread('R1', 'RUNNING', 3), AREA)).toBe('hall');
    expect(zoneOf(gated, thread('R1', 'RUNNING', 4), AREA)).toBe('hall');
    expect(zoneOf(gated, thread('R1', 'RUNNING', 5), AREA)).toBe('work');
    expect(zoneOf(gated, thread('R1', 'TERMINATED', 0), AREA)).toBe('done');
  });

  it('tanpa gerbang: robot langsung masuk aula tanpa zona pintu', () => {
    const plain = programOf([]);
    // [WORK, ENTER_AREA, WORK, LEAVE_AREA]
    expect(zoneOf(plain, thread('R1', 'READY', 0), AREA)).toBe('work');
    expect(zoneOf(plain, thread('R1', 'READY', 1), AREA)).toBe('work');
    expect(zoneOf(plain, thread('R1', 'RUNNING', 2), AREA)).toBe('hall');
    expect(zoneOf(plain, thread('R1', 'RUNNING', 3), AREA)).toBe('hall');
  });

  it('program tanpa area itu: selalu zona kerja', () => {
    expect(zoneOf([], thread('R1', 'READY', 0), AREA)).toBe('work');
  });
});

describe('zona robot cocok dengan engine (seed ber-variasi)', () => {
  const cases: (number | null)[] = [null, 1, 3, 5];
  const seeds = [10, 3, 7];

  for (const value of cases) {
    for (const seed of seeds) {
      it(`kapasitas kartu ${value ?? 'tanpa gerbang'}, seed ${seed}`, () => {
        const tools = value === null ? [] : [cardGate(value)];
        const effective = applyTools(level1_3.threads, tools);
        const engine = new Engine();
        engine.load(buildEngineConfig(level1_3, tools), seed);

        const check = (): void => {
          const snap = engine.getSnapshot();
          const list = hallRobots(effective, snap.threads, AREA);
          const inHall = list.filter((r) => r.zone === 'hall').length;
          expect(inHall, `tick ${snap.tick}: robot di aula`).toBe(
            snap.areaOccupancy[AREA] ?? 0,
          );
          const queued = list.filter((r) => r.zone === 'queue').length;
          const semQueue = snap.semaphores.reduce(
            (sum, s) => sum + s.queue.length,
            0,
          );
          expect(queued, `tick ${snap.tick}: robot mengantre`).toBe(semQueue);
        };

        check();
        while (!engine.isFinished) {
          engine.step();
          check();
        }
      });
    }
  }
});

describe('seatInHall', () => {
  it('robot baru mengisi kursi dari yang terkecil', () => {
    const seats = seatInHall(['R1', 'R2', 'R3'], new Map(), 6);
    expect([...seats]).toEqual([
      ['R1', 0],
      ['R2', 1],
      ['R3', 2],
    ]);
  });

  it('kursi lengket: robot yang tetap di dalam tidak berpindah', () => {
    const first = seatInHall(['R1', 'R2', 'R3'], new Map(), 6);
    const second = seatInHall(['R1', 'R3', 'R4'], first, 6);
    expect(second.get('R1')).toBe(0);
    expect(second.get('R3')).toBe(2);
    expect(second.get('R4')).toBe(1);
  });

  it('robot melebihi kursi berbagi kursi terakhir', () => {
    const seats = seatInHall(['R1', 'R2', 'R3', 'R4', 'R5'], new Map(), 4);
    expect(seats.get('R4')).toBe(3);
    expect(seats.get('R5')).toBe(3);
  });

  it('kursi lama di luar jangkauan atau bentrok diabaikan', () => {
    const outOfRange = seatInHall(['R1'], new Map([['R1', 9]]), 3);
    expect(outOfRange.get('R1')).toBe(0);
    const clash = seatInHall(
      ['R1', 'R2'],
      new Map([
        ['R1', 1],
        ['R2', 1],
      ]),
      3,
    );
    expect(clash.get('R1')).toBe(1);
    expect(clash.get('R2')).toBe(0);
  });

  it('tanpa kursi: hasil kosong', () => {
    expect(seatInHall(['R1'], new Map(), 0).size).toBe(0);
  });
});

describe('assignHallSpots', () => {
  it('robot kerja dan selesai memakai titik tetap menurut indeks', () => {
    const list = robots(['work', 'done', 'work', 'done']);
    const { spots } = assignHallSpots(hall1_3, list, [], new Map());
    expect(spots.get('R1')).toEqual(hall1_3.workSpots[0]);
    expect(spots.get('R2')).toEqual(hall1_3.doneSpots[1]);
    expect(spots.get('R3')).toEqual(hall1_3.workSpots[2]);
    expect(spots.get('R4')).toEqual(hall1_3.doneSpots[3]);
  });

  it('antrean: robot di pintu paling depan, lalu menurut urutan FIFO semaphore', () => {
    const list = robots([
      'work',
      'queue',
      'door',
      'queue',
      'work',
      'work',
      'work',
      'work',
    ]);
    const { spots } = assignHallSpots(hall1_3, list, ['R4', 'R2'], new Map());
    expect(spots.get('R3')).toEqual(hall1_3.queueSpots[0]);
    expect(spots.get('R4')).toEqual(hall1_3.queueSpots[1]);
    expect(spots.get('R2')).toEqual(hall1_3.queueSpots[2]);
  });

  it('robot mengantre yang tidak ada di urutan FIFO ditaruh di belakang', () => {
    const list = robots(['queue', 'queue']);
    const { spots } = assignHallSpots(hall1_3, list, ['R2'], new Map());
    expect(spots.get('R2')).toEqual(hall1_3.queueSpots[0]);
    expect(spots.get('R1')).toEqual(hall1_3.queueSpots[1]);
  });

  it('aula: tiga robot pertama di mesin, berikutnya di tempat luapan', () => {
    const list = robots(['hall', 'hall', 'hall', 'hall', 'work']);
    const { spots, seats } = assignHallSpots(hall1_3, list, [], new Map());
    expect(spots.get('R1')).toEqual(hall1_3.machines[0]);
    expect(spots.get('R2')).toEqual(hall1_3.machines[1]);
    expect(spots.get('R3')).toEqual(hall1_3.machines[2]);
    expect(spots.get('R4')).toEqual(hall1_3.overflowSpots[0]);
    expect(seats.size).toBe(4);
  });

  it('mesin lengket antar pemanggilan: yang keluar digantikan yang baru masuk', () => {
    const first = assignHallSpots(
      hall1_3,
      robots(['hall', 'hall', 'hall', 'hall', 'work']),
      [],
      new Map(),
    );
    const second = assignHallSpots(
      hall1_3,
      robots(['hall', 'work', 'hall', 'hall', 'hall']),
      [],
      first.seats,
    );
    expect(second.spots.get('R1')).toEqual(hall1_3.machines[0]);
    expect(second.spots.get('R3')).toEqual(hall1_3.machines[2]);
    expect(second.spots.get('R4')).toEqual(hall1_3.overflowSpots[0]);
    expect(second.spots.get('R5')).toEqual(hall1_3.machines[1]);
  });
});
