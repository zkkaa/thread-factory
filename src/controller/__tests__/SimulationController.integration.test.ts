import { describe, it, expect } from 'vitest';
import { Engine } from '../../engine/engine';
import { level1_1 } from '../../levels/module1/level-1-1';
import { SimulationController, TICK_INTERVAL_MS } from '../SimulationController';
import { ManualClock } from './manualClock';

/** Controller sungguhan + Engine sungguhan + Level 1-1, jam tetap palsu. */
function setup() {
  const clock = new ManualClock();
  const controller = new SimulationController(new Engine(), clock);
  controller.loadLevel(level1_1);
  return { clock, controller };
}

function runToEnd(controller: SimulationController, clock: ManualClock): void {
  controller.run();
  clock.advance(0);
  for (let i = 0; i < 5000 && controller.getState().runState === 'running'; i++) {
    clock.advance(TICK_INTERVAL_MS);
  }
}

describe('SimulationController + Engine + Level 1-1', () => {
  it('tanpa mutex pada tutorialSeed: simulasi selesai dan hasilnya salah', () => {
    const { clock, controller } = setup();
    runToEnd(controller, clock);
    const state = controller.getState();
    expect(state.runState).toBe('finished');
    expect(state.error).toBeNull();
    expect(state.snapshot).not.toBeNull();
    if (state.snapshot === null) return;
    expect(level1_1.goal.invariant(state.snapshot).ok).toBe(false);
  });

  it('seed sama (lewat reset) menghasilkan keadaan akhir identik', () => {
    const { clock, controller } = setup();
    runToEnd(controller, clock);
    const first = controller.getState().snapshot;

    controller.reset();
    expect(controller.getState().runState).toBe('idle');
    expect(controller.getState().snapshot?.tick).toBe(0);
    runToEnd(controller, clock);
    expect(controller.getState().snapshot).toEqual(first);
  });

  it('step manual berulang sampai selesai memberi hasil sama dengan Run', () => {
    const a = setup();
    runToEnd(a.controller, a.clock);

    const b = setup();
    for (let i = 0; i < 5000 && b.controller.getState().runState !== 'finished'; i++) {
      b.controller.step();
    }
    expect(b.controller.getState().snapshot).toEqual(a.controller.getState().snapshot);
  });
});