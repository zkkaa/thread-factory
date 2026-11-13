import { describe, expect, it } from 'vitest';
import { buildEngineConfig } from '../../../controller/buildEngineConfig';
import { computeCoffman } from '../../../engine/coffman';
import { Engine } from '../../../engine/engine';
import type { PlacedTool } from '../../../engine/tools';
import { level2_3 } from '../level-2-3';

const SEED = level2_3.tutorialSeed as number;

function seatTool(value: number): PlacedTool {
  return {
    id: 'semaphore:kursi',
    kind: 'semaphore',
    sem: 'kursi',
    value,
    spans: level2_3.threads.map((t) => ({ thread: t.id, start: 0, end: 4 })),
  };
}

function load(tools: PlacedTool[]): Engine {
  const engine = new Engine();
  engine.load(buildEngineConfig(level2_3, tools), SEED);
  return engine;
}

describe('computeCoffman (T-059)', () => {
  it('tick 0: tidak ada kondisi yang berlaku', () => {
    const state = computeCoffman(load([]).getSnapshot());
    expect(Object.values(state).every((on) => !on)).toBe(true);
  });

  it('tanpa alat: saat deadlock keempat kondisi berlaku', () => {
    const engine = load([]);
    for (let i = 0; i < 1000 && !engine.getSnapshot().deadlock; i += 1) {
      engine.step();
    }
    expect(computeCoffman(engine.getSnapshot())).toEqual({
      mutualExclusion: true,
      holdAndWait: true,
      noPreemption: true,
      circularWait: true,
    });
  });

  it('kursi 4: circular wait tidak pernah berlaku sepanjang simulasi', () => {
    const engine = load([seatTool(4)]);
    for (let i = 0; i < 1000 && !engine.isFinished; i += 1) {
      engine.step();
      expect(computeCoffman(engine.getSnapshot()).circularWait).toBe(false);
    }
    expect(engine.isFinished).toBe(true);
  });

  it('setelah kunci dirampas, no preemption padam', () => {
    const engine = load([]);
    for (let i = 0; i < 1000 && !engine.getSnapshot().deadlock; i += 1) {
      engine.step();
    }
    engine.preempt();
    expect(computeCoffman(engine.getSnapshot()).noPreemption).toBe(false);
  });
});
