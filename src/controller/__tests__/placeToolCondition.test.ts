import { describe, expect, it } from 'vitest';
import { SimulationController } from '../SimulationController';
import type { PlacedConditionTool } from '../../engine/tools';
import { level1_3 } from '../../levels/module1/level-1-3';
import { level1_4 } from '../../levels/module1/level-1-4';

function lampu(): PlacedConditionTool {
  return {
    id: 'condition:lampu',
    kind: 'condition',
    cond: 'lampu',
    mutex: 'meja',
    waiter: { thread: 'P', index: 0 },
    signaler: { thread: 'A', slot: 4 },
    spans: [],
  };
}

function runToEnd(controller: SimulationController): void {
  for (let i = 0; i < 500; i++) {
    if (controller.getState().runState === 'finished') return;
    controller.step();
  }
  throw new Error('Simulasi tidak selesai dalam 500 langkah');
}

describe('placeTool dengan alat condition (T-091)', () => {
  it('menerima alat condition di level yang menyediakannya', () => {
    const controller = new SimulationController();
    controller.loadLevel(level1_4);
    controller.placeTool(lampu());
    expect(controller.getState().tools).toHaveLength(1);
    expect(controller.getState().tools[0]?.kind).toBe('condition');
  });

  it('menolak alat condition di level yang tidak menyediakannya', () => {
    const controller = new SimulationController();
    controller.loadLevel(level1_3);
    expect(() => controller.placeTool(lampu())).toThrow(/tidak tersedia/);
    expect(controller.getState().tools).toHaveLength(0);
  });

  it('alat tidak valid ditolak dan state lama tetap utuh', () => {
    const controller = new SimulationController();
    controller.loadLevel(level1_4);
    const before = controller.getState();
    const bad = lampu();
    bad.waiter = { thread: 'P', index: 1 }; // WORK, bukan SPIN_UNTIL
    expect(() => controller.placeTool(bad)).toThrow(/SPIN_UNTIL/);
    expect(controller.getState().tools).toHaveLength(0);
    expect(controller.getState().snapshot).toBe(before.snapshot);
  });

  it('state menyimpan salinan dalam: mengubah masukan tidak mengubah state', () => {
    const controller = new SimulationController();
    controller.loadLevel(level1_4);
    const tool = lampu();
    controller.placeTool(tool);
    tool.waiter.index = 99;
    tool.signaler.slot = 99;
    const stored = controller.getState().tools[0];
    expect(stored?.kind).toBe('condition');
    if (stored?.kind === 'condition') {
      expect(stored.waiter.index).toBe(0);
      expect(stored.signaler.slot).toBe(4);
    }
  });

  it('removeTool melepas alat condition', () => {
    const controller = new SimulationController();
    controller.loadLevel(level1_4);
    controller.placeTool(lampu());
    controller.removeTool('condition:lampu');
    expect(controller.getState().tools).toHaveLength(0);
  });

  it('alat terkunci setelah simulasi dimulai', () => {
    const controller = new SimulationController();
    controller.loadLevel(level1_4);
    controller.step();
    expect(() => controller.placeTool(lampu())).toThrow(/terkunci/);
  });

  it('simulasi penuh lewat controller: lulus dengan 3 bintang pada seed tutorial', () => {
    const controller = new SimulationController();
    controller.loadLevel(level1_4);
    controller.placeTool(lampu());
    runToEnd(controller);
    const { result } = controller.getState();
    expect(result?.ok).toBe(true);
    expect(result?.stars).toBe(3);
  });

  it('tanpa alat: simulasi penuh lewat controller dinilai gagal', () => {
    const controller = new SimulationController();
    controller.loadLevel(level1_4);
    runToEnd(controller);
    expect(controller.getState().result?.ok).toBe(false);
  });

  it('reset mempertahankan alat dan hasil tetap sama (deterministik)', () => {
    const controller = new SimulationController();
    controller.loadLevel(level1_4);
    controller.placeTool(lampu());
    runToEnd(controller);
    const first = controller.getState().result;
    controller.reset();
    expect(controller.getState().tools).toHaveLength(1);
    runToEnd(controller);
    expect(controller.getState().result?.metrics.tick).toBe(
      first?.metrics.tick,
    );
  });
});
