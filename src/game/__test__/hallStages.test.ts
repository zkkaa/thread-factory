import { describe, expect, it } from 'vitest';
import {
  applyToolsDetailed,
  type PlacedSemaphoreTool,
} from '../../engine/tools';
import type { ThreadId } from '../../engine/types';
import { level1_3 } from '../../levels/module1/level-1-3';
import {
  assignSpots,
  isRespawn,
  laneOf,
  routeBetween,
  spotPoint,
  stageMarks,
  stageOf,
  type HallStage,
  type SpotRef,
} from '../hallStages';
import { layout1_3 } from '../layouts/level-1-3.layout';
import { validateHallLayout } from '../layouts/validateHall';

const ORIGINAL = level1_3.threads[0]?.program ?? [];
const THREADS = level1_3.threads.map((t) => ({ id: t.id }));

function gateTool(): PlacedSemaphoreTool {
  return {
    id: 'semaphore:kartu',
    kind: 'semaphore',
    sem: 'kartu',
    value: 3,
    spans: level1_3.threads.map((t) => ({ thread: t.id, start: 1, end: 3 })),
  };
}

function marksWith(tools: PlacedSemaphoreTool[]) {
  const { origins } = applyToolsDetailed(level1_3.threads, tools);
  const marks = stageMarks(ORIGINAL, origins['R1'] ?? []);
  if (marks === null) throw new Error('marks null');
  return marks;
}

describe('validateHallLayout', () => {
  it('layout 1-3 sah terhadap level 1-3', () => {
    expect(validateHallLayout(layout1_3, level1_3)).toEqual([]);
  });

  it('melaporkan jumlah slot yang salah', () => {
    const rusak = { ...layout1_3, slots: layout1_3.slots.slice(0, 3) };
    expect(validateHallLayout(rusak, level1_3)).not.toEqual([]);
  });

  it('melaporkan robot yang tidak punya lajur', () => {
    const lanes = layout1_3.lanes.map((lane, i) =>
      i === 1 ? { ...lane, robots: [4, 5, 6] } : lane,
    );
    const errors = validateHallLayout({ ...layout1_3, lanes }, level1_3);
    expect(errors.some((e) => e.includes('robot 7'))).toBe(true);
  });
});

describe('laneOf', () => {
  it('robot 0 sampai 3 di lajur atas, 4 sampai 7 di lajur bawah', () => {
    expect(laneOf(layout1_3, 0)).toBe(0);
    expect(laneOf(layout1_3, 3)).toBe(0);
    expect(laneOf(layout1_3, 4)).toBe(1);
    expect(laneOf(layout1_3, 7)).toBe(1);
  });
});

describe('stageOf tanpa gerbang', () => {
  const marks = marksWith([]);
  it('mengenali penanda', () => {
    expect(marks).toEqual({ workIdx: 0, enterIdx: 1, leaveIdx: 3 });
  });
  it('menentukan tahap dari pc', () => {
    expect(stageOf({ state: 'READY', pc: 0 }, marks)).toBe('prep');
    expect(stageOf({ state: 'READY', pc: 1 }, marks)).toBe('queue');
    expect(stageOf({ state: 'RUNNING', pc: 2 }, marks)).toBe('area');
    expect(stageOf({ state: 'RUNNING', pc: 3 }, marks)).toBe('area');
    expect(stageOf({ state: 'TERMINATED', pc: 0 }, marks)).toBe('done');
  });
});

describe('stageOf dengan gerbang di slot 1 dan 4', () => {
  const marks = marksWith([gateTool()]);
  it('menggeser penanda sesuai instruksi sisipan', () => {
    expect(marks).toEqual({ workIdx: 0, enterIdx: 2, leaveIdx: 4 });
  });
  it('robot yang menunggu kartu berada di antrean', () => {
    expect(stageOf({ state: 'WAITING', pc: 1 }, marks)).toBe('queue');
  });
  it('SEM_SIGNAL yang tertunda berada di pintu keluar', () => {
    expect(stageOf({ state: 'RUNNING', pc: 5 }, marks)).toBe('exit');
  });
});

describe('assignSpots', () => {
  const stages = (entries: [ThreadId, HallStage][]) => new Map(entries);

  it('antrean per lajur mengikuti urutan FIFO semaphore', () => {
    const result = assignSpots(
      layout1_3,
      THREADS,
      stages([
        ['R1', 'queue'],
        ['R3', 'queue'],
        ['R5', 'queue'],
      ]),
      ['R3', 'R1'],
      new Map(),
    );
    expect(result.get('R3')).toEqual({ stage: 'queue', index: 0, lane: 0 });
    expect(result.get('R1')).toEqual({ stage: 'queue', index: 1, lane: 0 });
    expect(result.get('R5')).toEqual({ stage: 'queue', index: 0, lane: 1 });
  });

  it('robot di area tidak berpindah tempat; pendatang mengisi yang kosong', () => {
    const previous = new Map<ThreadId, SpotRef>([
      ['R2', { stage: 'area', index: 2, lane: 0 }],
    ]);
    const result = assignSpots(
      layout1_3,
      THREADS,
      stages([
        ['R1', 'area'],
        ['R2', 'area'],
      ]),
      [],
      previous,
    );
    expect(result.get('R2')).toEqual({ stage: 'area', index: 2, lane: 0 });
    expect(result.get('R1')).toEqual({ stage: 'area', index: 0, lane: 0 });
  });

  it('pijakan dipakai untuk rakit dan selesai', () => {
    const result = assignSpots(
      layout1_3,
      THREADS,
      stages([
        ['R4', 'prep'],
        ['R6', 'done'],
      ]),
      [],
      new Map(),
    );
    expect(result.get('R4')).toEqual({ stage: 'prep', index: 3, lane: 0 });
    expect(result.get('R6')).toEqual({ stage: 'done', index: 5, lane: 1 });
    const point = spotPoint(layout1_3, result.get('R6') as SpotRef);
    expect(point).toEqual(layout1_3.prepSpots[5]);
  });
});

describe('spotPoint', () => {
  it('memotong indeks antrean ke tempat terakhir lajurnya', () => {
    const point = spotPoint(layout1_3, { stage: 'queue', index: 99, lane: 1 });
    expect(point).toEqual(layout1_3.lanes[1]?.queueSpots[3]);
  });
});

describe('routeBetween dan isRespawn', () => {
  const dest = { x: 1, y: 2 };

  it('pijakan ke antrean lewat sumbu tegak ke lajurnya', () => {
    const route = routeBetween(layout1_3, 0, 'prep', 'queue', dest);
    expect(route).toEqual([
      { x: 463, y: 207 },
      { x: 463, y: 284 },
      dest,
    ]);
  });

  it('antrean ke area lewat gerbang, belok, dan titik gabung (lajur bawah)', () => {
    const route = routeBetween(layout1_3, 5, 'queue', 'area', dest);
    expect(route).toEqual([
      { x: 800, y: 423 },
      { x: 940, y: 423 },
      layout1_3.merge,
      dest,
    ]);
  });

  it('area ke pintu keluar langsung', () => {
    expect(routeBetween(layout1_3, 0, 'area', 'exit', dest)).toEqual([dest]);
  });

  it('keluar lalu kembali ke pijakan adalah respawn tanpa jalur', () => {
    expect(isRespawn('exit', 'prep')).toBe(true);
    expect(isRespawn('area', 'done')).toBe(true);
    expect(isRespawn('queue', 'area')).toBe(false);
    expect(routeBetween(layout1_3, 0, 'area', 'prep', dest)).toEqual([dest]);
  });
});