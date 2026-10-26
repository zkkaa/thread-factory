import { describe, it, expect } from 'vitest';
import { Engine } from '../../engine/engine';
import type { PlacedTool } from '../../engine/tools';
import type { StepResult } from '../../engine/types';
import { level1_1 } from '../../levels/module1/level-1-1';
import type { Clock } from '../clock';
import { SimulationController } from '../SimulationController';

/** Jam palsu: mencatat berapa kali jam diminta. Tes ini hanya memakai step() manual. */
class CountingClock implements Clock {
  requests = 0;
  requestFrame(): number {
    this.requests += 1;
    return this.requests;
  }
  cancelFrame(): void {}
}

/** Engine yang selalu gagal saat step(), untuk menguji penanganan error. */
class ThrowingEngine extends Engine {
  override step(): StepResult {
    throw new Error('boom');
  }
}

const MUTEX_PAS: PlacedTool = {
  id: 'm1',
  kind: 'mutex',
  mutex: 'papan',
  spans: [
    { thread: 'A', start: 1, end: 3 },
    { thread: 'B', start: 1, end: 3 },
  ],
};

function stepUntilFinished(controller: SimulationController): number {
  let steps = 0;
  while (controller.getState().runState !== 'finished') {
    controller.step();
    if (++steps > 500) throw new Error('tidak selesai');
  }
  return steps;
}

describe('SimulationController: result', () => {
  it('result null sebelum dan selama simulasi, terisi saat finished', () => {
    const controller = new SimulationController(
      new Engine(),
      new CountingClock(),
    );
    controller.loadLevel(level1_1);
    controller.placeTool(MUTEX_PAS);
    expect(controller.getState().result).toBeNull();

    for (let i = 0; i < 59; i++) controller.step();
    expect(controller.getState().runState).toBe('paused');
    expect(controller.getState().result).toBeNull();

    controller.step();
    const state = controller.getState();
    expect(state.runState).toBe('finished');
    expect(state.result?.ok).toBe(true);
    expect(state.result?.stars).toBe(3);
  });

  it('tanpa mutex pada seed tutorial: gagal, "hasilnya 8", 2 pembaruan hilang', () => {
    const controller = new SimulationController(
      new Engine(),
      new CountingClock(),
    );
    controller.loadLevel(level1_1);
    stepUntilFinished(controller);
    const result = controller.getState().result;
    expect(result?.ok).toBe(false);
    expect(result?.message).toContain('8');
    expect(result?.metrics.lostUpdates).toBe(2);
    expect(result?.stars).toBe(0);
  });

  it('seed selain tutorial: lulus tapi tidak dinilai bintang', () => {
    const controller = new SimulationController(
      new Engine(),
      new CountingClock(),
    );
    controller.loadLevel(level1_1, 11);
    controller.placeTool(MUTEX_PAS);
    stepUntilFinished(controller);
    expect(controller.getState().result?.ok).toBe(true);
    expect(controller.getState().result?.stars).toBeNull();
  });

  it('reset, loadLevel, dan perubahan alat menghapus result', () => {
    const controller = new SimulationController(
      new Engine(),
      new CountingClock(),
    );
    controller.loadLevel(level1_1);
    stepUntilFinished(controller);
    expect(controller.getState().result).not.toBeNull();

    controller.reset();
    expect(controller.getState().result).toBeNull();

    stepUntilFinished(controller);
    controller.loadLevel(level1_1);
    expect(controller.getState().result).toBeNull();

    controller.placeTool(MUTEX_PAS);
    expect(controller.getState().result).toBeNull();
  });

  it('data level yang salah dilaporkan sebagai error, bukan melempar dari step()', () => {
    const broken = {
      ...level1_1,
      goal: { ...level1_1.goal, target: { variable: 'hantu', value: 1 } },
    };
    const controller = new SimulationController(
      new Engine(),
      new CountingClock(),
    );
    controller.loadLevel(broken);
    expect(() => stepUntilFinished(controller)).not.toThrow();
    expect(controller.getState().error).toMatch(/Gagal menilai hasil.*"hantu"/);
    expect(controller.getState().result).toBeNull();
  });
});

describe('SimulationController: error engine mengunci Run dan Step sampai Reset', () => {
  function makeFailing() {
    const clock = new CountingClock();
    const controller = new SimulationController(new ThrowingEngine(), clock);
    controller.loadLevel(level1_1);
    return { controller, clock };
  }

  it('error dari engine: state paused, pesan tersimpan, result null', () => {
    const { controller } = makeFailing();
    controller.step();
    const state = controller.getState();
    expect(state.error).toBe('boom');
    expect(state.runState).toBe('paused');
    expect(state.result).toBeNull();
  });

  it('Run dan Step setelah error diabaikan (state dan jam tidak berubah)', () => {
    const { controller, clock } = makeFailing();
    controller.step();
    const before = controller.getState();

    controller.step();
    controller.run();

    expect(controller.getState()).toBe(before);
    expect(clock.requests).toBe(0);
  });

  it('alat tetap terkunci setelah error', () => {
    const { controller } = makeFailing();
    controller.step();
    expect(() => controller.placeTool(MUTEX_PAS)).toThrow(/terkunci/);
  });

  it('Reset menghapus error dan membuka kunci lagi', () => {
    const { controller } = makeFailing();
    controller.step();
    controller.reset();
    const state = controller.getState();
    expect(state.error).toBeNull();
    expect(state.runState).toBe('idle');
    expect(() => controller.placeTool(MUTEX_PAS)).not.toThrow();
  });
});
