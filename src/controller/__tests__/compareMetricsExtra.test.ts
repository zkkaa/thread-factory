import { describe, expect, it } from 'vitest';
import { level1_1 } from '../../levels';
import { compareStates, jainIndex } from '../compareMetrics';
import { SimulationController } from '../SimulationController';

function finishedController(): SimulationController {
  const controller = new SimulationController();
  controller.loadLevel(level1_1);
  for (let i = 0; i < 3000; i++) {
    if (controller.getState().runState === 'finished') break;
    controller.step();
  }
  return controller;
}

describe('jainIndex', () => {
  it('bernilai 1 bila semua sama rata', () => {
    expect(jainIndex([5, 5, 5])).toBe(1);
  });

  it('mendekati 1/n bila satu pihak memborong', () => {
    expect(jainIndex([10, 0, 0, 0])).toBe(0.25);
  });

  it('bernilai 0 bila belum ada yang mendapat giliran atau daftar kosong', () => {
    expect(jainIndex([0, 0])).toBe(0);
    expect(jainIndex([])).toBe(0);
  });
});

describe('compareStates: baris pembaruan hilang dan fairness', () => {
  it('memuat kedua baris baru dan nilainya sama dengan hasil level', () => {
    const controller = finishedController();
    const state = controller.getState();
    expect(state.runState).toBe('finished');

    const summary = compareStates(state, state);
    expect(summary).not.toBeNull();
    const keys = summary?.rows.map((row) => row.key) ?? [];
    expect(keys).toContain('lostUpdates');
    expect(keys).toContain('fairness');

    const lost = summary?.rows.find((row) => row.key === 'lostUpdates');
    expect(lost?.a).toBe(state.result?.metrics.lostUpdates ?? 0);
    expect(lost?.better).toBe('sama');
  });
});
