import { describe, expect, it } from 'vitest';
import { buildEngineConfig } from '../../controller/buildEngineConfig';
import { Engine } from '../../engine/engine';
import type { PlacedConditionTool, PlacedTool } from '../../engine/tools';
import { level1_4 } from '../../levels/module1/level-1-4';
import { deriveTableState } from '../tableState';

const LAMPU: PlacedConditionTool = {
  id: 'condition:lampu',
  kind: 'condition',
  cond: 'lampu',
  mutex: 'meja',
  waiter: { thread: 'P', index: 0 },
  signaler: { thread: 'A', slot: 4 },
  spans: [],
};

function engineAfter(tools: PlacedTool[], ticks: number | 'end'): Engine {
  const engine = new Engine();
  engine.load(buildEngineConfig(level1_4, tools), 10);
  if (ticks === 'end') {
    while (!engine.isFinished) engine.step();
  } else {
    for (let i = 0; i < ticks; i++) engine.step();
  }
  return engine;
}

function derive(engine: Engine) {
  return deriveTableState(engine.getSnapshot(), 'P', 'barang', 3);
}

describe('deriveTableState (T-092)', () => {
  it('keadaan awal: meja kosong, lampu merah, baterai penuh', () => {
    const state = derive(engineAfter([], 0));
    expect(state.items).toBe(0);
    expect(state.target).toBe(3);
    expect(state.lampGreen).toBe(false);
    expect(state.lampLabel).toMatch(/MERAH/);
    expect(state.battery).toBe(1);
  });

  it('tanpa alat: pengepak busy waiting dan baterainya turun', () => {
    const state = derive(engineAfter([], 6));
    expect(state.packerMode).toBe('spinning');
    expect(state.battery).toBeLessThan(1);
    expect(state.modeLabel).toMatch(/busy waiting/);
  });

  it('tanpa alat sampai selesai: baterai nyaris habis', () => {
    const state = derive(engineAfter([], 'end'));
    expect(state.packerMode).toBe('done');
    expect(state.items).toBe(3);
    expect(state.lampGreen).toBe(true);
    expect(state.battery).toBeLessThanOrEqual(0.1);
  });

  it('dengan Lampu Sinyal: pengepak tidur dan baterai tetap penuh', () => {
    const state = derive(engineAfter([LAMPU], 5));
    expect(state.packerMode).toBe('sleeping');
    expect(state.lampGreen).toBe(false);
    expect(state.battery).toBe(1);
    expect(state.modeLabel).toMatch(/Tidur/);
  });

  it('dengan Lampu Sinyal sampai selesai: lampu hijau, baterai penuh', () => {
    const state = derive(engineAfter([LAMPU], 'end'));
    expect(state.packerMode).toBe('done');
    expect(state.items).toBe(3);
    expect(state.lampGreen).toBe(true);
    expect(state.lampLabel).toMatch(/HIJAU/);
    expect(state.battery).toBe(1);
  });

  it('melempar error bila pengepak tidak ada di snapshot', () => {
    const snapshot = engineAfter([], 0).getSnapshot();
    expect(() => deriveTableState(snapshot, 'Z', 'barang', 3)).toThrow(/Z/);
  });
});
