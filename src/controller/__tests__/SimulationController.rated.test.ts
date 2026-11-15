import { describe, it, expect } from 'vitest';
import { Engine } from '../../engine/engine';
import type { PlacedTool } from '../../engine/tools';
import { level1_1 } from '../../levels/module1/level-1-1';
import type { Clock } from '../clock';
import { SimulationController } from '../SimulationController';

/** Jam palsu: tes ini hanya memakai step() manual. */
class NoopClock implements Clock {
  requestFrame(): number {
    return 1;
  }
  cancelFrame(): void {}
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

function makeController(): SimulationController {
  return new SimulationController(new Engine(), new NoopClock());
}

function stepUntilFinished(controller: SimulationController): void {
  let steps = 0;
  while (controller.getState().runState !== 'finished') {
    controller.step();
    if (++steps > 500) throw new Error('tidak selesai');
  }
}

describe('SimulationController: loadLevel dengan rated: false', () => {
  it('lulus pada seed tutorial tetapi tanpa bintang', () => {
    const controller = makeController();
    controller.loadLevel(level1_1, undefined, { rated: false });
    controller.placeTool(MUTEX_PAS);
    stepUntilFinished(controller);
    const result = controller.getState().result;
    expect(result?.ok).toBe(true);
    expect(result?.stars).toBeNull();
  });

  it('reset mempertahankan penanda tanpa bintang', () => {
    const controller = makeController();
    controller.loadLevel(level1_1, undefined, { rated: false });
    controller.placeTool(MUTEX_PAS);
    stepUntilFinished(controller);
    controller.reset();
    stepUntilFinished(controller);
    expect(controller.getState().result?.stars).toBeNull();
  });

  it('loadLevel berikutnya tanpa opsi mengembalikan penilaian bintang', () => {
    const controller = makeController();
    controller.loadLevel(level1_1, undefined, { rated: false });
    controller.loadLevel(level1_1);
    controller.placeTool(MUTEX_PAS);
    stepUntilFinished(controller);
    expect(controller.getState().result?.stars).toBe(3);
  });
});