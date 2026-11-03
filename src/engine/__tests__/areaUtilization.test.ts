import { describe, expect, it } from 'vitest';
import { Engine } from '../engine';
import type { EngineConfig, ThreadDef } from '../types';

function robot(id: string): ThreadDef {
  return {
    id,
    label: `Robot ${id}`,
    program: [
      { op: 'ENTER_AREA', area: 'aula' },
      { op: 'WORK', ticks: 2 },
      { op: 'LEAVE_AREA', area: 'aula' },
    ],
  };
}

function runToEnd(config: EngineConfig) {
  const engine = new Engine();
  engine.load(config, 1);
  while (!engine.isFinished) engine.step();
  return engine.getSnapshot();
}

describe('areaUtilization dan overloadTicks bernilai pasti (T-041)', () => {
  it('satu robot, kapasitas 2: jumlah di area 1,1,1,0 -> rata-rata 0.75 -> utilisasi 0.375', () => {
    const snap = runToEnd({
      threads: [robot('A')],
      sharedVars: {},
      mutexes: [],
      semaphores: {},
      conditions: [],
      areas: { aula: 2 },
      scheduler: { kind: 'random', cores: 1 },
      maxTicks: 100,
    });
    expect(snap.tick).toBe(4);
    expect(snap.areaUtilization).toBeCloseTo(0.375, 10);
    expect(snap.overloadTicks).toBe(0);
    expect(snap.areaOccupancy).toEqual({ aula: 0 });
  });

  it('dua robot, kapasitas 1: bentrok di tick 1 sampai 3, utilisasi dibatasi 1', () => {
    const snap = runToEnd({
      threads: [robot('A'), robot('B')],
      sharedVars: {},
      mutexes: [],
      semaphores: {},
      conditions: [],
      areas: { aula: 1 },
      scheduler: { kind: 'random', cores: 2 },
      maxTicks: 100,
    });
    expect(snap.tick).toBe(4);
    expect(snap.overloadTicks).toBe(3);
    expect(snap.areaUtilization).toBe(1);
  });
});
