import { describe, expect, it } from 'vitest';
import type {
  Instruction,
  ThreadDef,
  ThreadSnapshot,
} from '../../engine/types';
import {
  assignFlowSpots,
  flowRobots,
  flowZoneOf,
  type FlowRobot,
  type FlowZone,
} from '../flowSpots';
import { flow1_5 } from '../layouts/level-1-5.flow.layout';

/** Program efektif dengan kartu, mutex, dan sinyal terpasang (ENTER di 2, LEAVE di 4). */
const FULL: Instruction[] = [
  { op: 'WORK', ticks: 1 },
  { op: 'SEM_WAIT', sem: 'kartu' },
  { op: 'ENTER_AREA', area: 'aula' },
  { op: 'WORK', ticks: 2 },
  { op: 'LEAVE_AREA', area: 'aula' },
  { op: 'SEM_SIGNAL', sem: 'kartu' },
  { op: 'LOCK', mutex: 'meja' },
  { op: 'READ', from: 'barang', into: 'r' },
  { op: 'COMPUTE', reg: 'r', add: 1 },
  { op: 'WRITE', reg: 'r', to: 'barang' },
  { op: 'UNLOCK', mutex: 'meja' },
];

/** Program asli tanpa alat (ENTER di 1, LEAVE di 3). */
const BARE: Instruction[] = [
  { op: 'WORK', ticks: 1 },
  { op: 'ENTER_AREA', area: 'aula' },
  { op: 'WORK', ticks: 2 },
  { op: 'LEAVE_AREA', area: 'aula' },
  { op: 'READ', from: 'barang', into: 'r' },
  { op: 'COMPUTE', reg: 'r', add: 1 },
  { op: 'WRITE', reg: 'r', to: 'barang' },
];

function snap(over: Partial<ThreadSnapshot>): ThreadSnapshot {
  return {
    id: 'R1',
    label: 'Robot 1',
    state: 'READY',
    pc: 0,
    iteration: 0,
    registers: {},
    waitingOn: null,
    workRemaining: 0,
    waitTicks: 0,
    busyWaitTicks: 0,
    ...over,
  };
}

function robot(index: number, zone: FlowZone): FlowRobot {
  return { id: `R${index + 1}`, index, zone };
}

const EMPTY_SEATS = {
  hall: new Map<string, number>(),
  stock: new Map<string, number>(),
};

describe('flowZoneOf', () => {
  it('program lengkap: zona menurut pc', () => {
    const zone = (pc: number) => flowZoneOf(FULL, snap({ pc }), 'aula');
    expect(zone(0)).toBe('work');
    expect(zone(1)).toBe('work');
    expect(zone(2)).toBe('hallQueue');
    expect(zone(3)).toBe('hall');
    expect(zone(4)).toBe('hall');
    expect(zone(5)).toBe('stock');
    expect(zone(9)).toBe('stock');
  });

  it('WAITING: kartu menjadi antrean aula, mutex menjadi antrean papan stok', () => {
    const sem = snap({ state: 'WAITING', pc: 1, waitingOn: 'sem:kartu' });
    const mtx = snap({ state: 'WAITING', pc: 6, waitingOn: 'mutex:meja' });
    expect(flowZoneOf(FULL, sem, 'aula')).toBe('hallQueue');
    expect(flowZoneOf(FULL, mtx, 'aula')).toBe('stockQueue');
  });

  it('TERMINATED menjadi done', () => {
    expect(flowZoneOf(FULL, snap({ state: 'TERMINATED' }), 'aula')).toBe(
      'done',
    );
  });

  it('tanpa alat: robot di ENTER_AREA belum dihitung antre', () => {
    expect(flowZoneOf(BARE, snap({ pc: 1 }), 'aula')).toBe('work');
    expect(flowZoneOf(BARE, snap({ pc: 2 }), 'aula')).toBe('hall');
    expect(flowZoneOf(BARE, snap({ pc: 4 }), 'aula')).toBe('stock');
  });

  it('program tanpa area menjadi work', () => {
    expect(flowZoneOf([{ op: 'WORK', ticks: 1 }], snap({}), 'aula')).toBe(
      'work',
    );
  });
});

describe('flowRobots', () => {
  it('melewati pengepak dan memberi indeks berurutan', () => {
    const defs: ThreadDef[] = ['R1', 'R2', 'P'].map((id) => ({
      id,
      label: id,
      program: BARE,
    }));
    const threads = ['R1', 'R2', 'P'].map((id) => snap({ id }));
    const robots = flowRobots(defs, threads, 'aula', 'P');
    expect(robots.map((r) => r.id)).toEqual(['R1', 'R2']);
    expect(robots.map((r) => r.index)).toEqual([0, 1]);
  });
});

describe('assignFlowSpots', () => {
  it('work memakai titik tetap menurut indeks', () => {
    const robots = Array.from({ length: 8 }, (_, i) => robot(i, 'work'));
    const { spots } = assignFlowSpots(flow1_5, robots, [], [], EMPTY_SEATS);
    expect(spots.get('R3')).toEqual(flow1_5.workSpots[2]);
    expect(spots.get('R8')).toEqual(flow1_5.workSpots[7]);
  });

  it('antrean aula: pemegang kartu dahulu, lalu urutan FIFO semaphore', () => {
    const robots = [
      robot(0, 'hallQueue'),
      robot(1, 'hallQueue'),
      robot(2, 'hallQueue'),
    ];
    const { spots } = assignFlowSpots(
      flow1_5,
      robots,
      ['R2', 'R1'],
      [],
      EMPTY_SEATS,
    );
    expect(spots.get('R3')).toEqual(flow1_5.hallQueueSpots[0]);
    expect(spots.get('R2')).toEqual(flow1_5.hallQueueSpots[1]);
    expect(spots.get('R1')).toEqual(flow1_5.hallQueueSpots[2]);
  });

  it('antrean mutex mengikuti urutan antrean mutex', () => {
    const robots = [robot(0, 'stockQueue'), robot(1, 'stockQueue')];
    const { spots } = assignFlowSpots(
      flow1_5,
      robots,
      [],
      ['R2', 'R1'],
      EMPTY_SEATS,
    );
    expect(spots.get('R2')).toEqual(flow1_5.stockQueueSpots[0]);
    expect(spots.get('R1')).toEqual(flow1_5.stockQueueSpots[1]);
  });

  it('kursi aula lengket dan robot ketiga memakai tempat luapan', () => {
    const robots = [robot(0, 'hall'), robot(1, 'hall'), robot(2, 'hall')];
    const previous = {
      hall: new Map([['R2', 1]]),
      stock: new Map<string, number>(),
    };
    const { spots, seats } = assignFlowSpots(flow1_5, robots, [], [], previous);
    expect(seats.hall.get('R2')).toBe(1);
    expect(spots.get('R2')).toEqual(flow1_5.machines[1]);
    expect(spots.get('R1')).toEqual(flow1_5.machines[0]);
    expect(spots.get('R3')).toEqual(flow1_5.overflowSpots[0]);
  });

  it('area kritis: tiap robot mendapat titik sendiri (terlihat saat tanpa mutex)', () => {
    const robots = Array.from({ length: 8 }, (_, i) => robot(i, 'stock'));
    const { spots } = assignFlowSpots(flow1_5, robots, [], [], EMPTY_SEATS);
    const unique = new Set([...spots.values()].map((p) => `${p.x},${p.y}`));
    expect(unique.size).toBe(8);
  });

  it('done memakai titik selesai menurut indeks', () => {
    const { spots } = assignFlowSpots(
      flow1_5,
      [robot(4, 'done')],
      [],
      [],
      EMPTY_SEATS,
    );
    expect(spots.get('R5')).toEqual(flow1_5.doneSpots[4]);
  });
});
