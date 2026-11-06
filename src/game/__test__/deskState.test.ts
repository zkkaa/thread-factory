import { describe, expect, it } from 'vitest';
import { buildEngineConfig } from '../../controller/buildEngineConfig';
import { Engine } from '../../engine/engine';
import type { PlacedConditionTool, PlacedTool } from '../../engine/tools';
import type { SimEvent } from '../../engine/types';
import { level1_4 } from '../../levels/module1/level-1-4';
import { deriveDeskState, sawSignal } from '../deskState';

function lampuAt(slot: number): PlacedConditionTool {
  return {
    id: 'condition:lampu',
    kind: 'condition',
    cond: 'lampu',
    mutex: 'meja',
    waiter: { thread: 'P', index: 0 },
    signaler: { thread: 'A', slot },
    spans: [],
  };
}
const LAMPU = lampuAt(4);

/** Menjalankan level; mengumpulkan semua event seperti yang dilihat arena. */
function runTo(tools: PlacedTool[], ticks: number | 'end') {
  const engine = new Engine();
  engine.load(buildEngineConfig(level1_4, tools), 10);
  const events: SimEvent[] = [];
  const once = () => events.push(...engine.step().events);
  if (ticks === 'end') {
    while (!engine.isFinished) once();
  } else {
    for (let i = 0; i < ticks; i++) once();
  }
  return { engine, events };
}

function derive(run: { engine: Engine; events: SimEvent[] }) {
  return deriveDeskState(
    run.engine.getSnapshot(),
    'P',
    'barang',
    3,
    sawSignal(run.events),
  );
}

describe('deriveDeskState (T-092)', () => {
  it('keadaan awal: meja kosong, lampu merah, baterai penuh, bersiap', () => {
    const state = derive(runTo([], 0));
    expect(state.items).toBe(0);
    expect(state.target).toBe(3);
    expect(state.lampGreen).toBe(false);
    expect(state.lampLabel).toMatch(/MERAH/);
    expect(state.battery).toBe(1);
    expect(state.packerMode).toBe('preparing');
  });
  it('tanpa alat: pengepak busy waiting dan baterainya turun', () => {
    const state = derive(runTo([], 6));
    expect(state.packerMode).toBe('spinning');
    expect(state.battery).toBeLessThan(1);
    expect(state.modeLabel).toMatch(/busy waiting/);
  });
  it('tanpa alat sampai selesai: baterai habis dan lampu tetap merah (tak ada sinyal)', () => {
    const state = derive(runTo([], 'end'));
    expect(state.packerMode).toBe('done');
    expect(state.items).toBe(3);
    expect(state.lampGreen).toBe(false);
    expect(state.lampLabel).toMatch(/belum ada sinyal/);
    expect(state.battery).toBeLessThanOrEqual(0.1);
  });
  it('dengan Lampu Sinyal: pengepak tidur, lampu merah, baterai penuh', () => {
    const state = derive(runTo([LAMPU], 5));
    expect(state.packerMode).toBe('sleeping');
    expect(state.lampGreen).toBe(false);
    expect(state.battery).toBe(1);
    expect(state.modeLabel).toMatch(/Tidur/);
  });
  it('dengan Lampu Sinyal sampai selesai: lampu hijau, baterai penuh', () => {
    const state = derive(runTo([LAMPU], 'end'));
    expect(state.packerMode).toBe('done');
    expect(state.items).toBe(3);
    expect(state.lampGreen).toBe(true);
    expect(state.lampLabel).toMatch(/HIJAU/);
    expect(state.battery).toBe(1);
  });
  it('sinyal terlalu cepat (slot 0): lampu hijau padahal barang masih 0', () => {
    const engine = new Engine();
    engine.load(buildEngineConfig(level1_4, [lampuAt(0)]), 10);
    const events: SimEvent[] = [];
    for (let i = 0; i < 50 && !sawSignal(events); i++) {
      events.push(...engine.step().events);
    }
    const state = deriveDeskState(engine.getSnapshot(), 'P', 'barang', 3, true);
    expect(sawSignal(events)).toBe(true);
    expect(state.items).toBe(0);
    expect(state.lampGreen).toBe(true);
  });
  it('melempar error bila pengepak tidak ada di snapshot', () => {
    const snapshot = runTo([], 0).engine.getSnapshot();
    expect(() => deriveDeskState(snapshot, 'Z', 'barang', 3, false)).toThrow(
      /Z/,
    );
  });
});

describe('sawSignal', () => {
  it('false tanpa event, true bila ada INSTRUCTION COND_SIGNAL', () => {
    expect(sawSignal([])).toBe(false);
    const withSignal = runTo([LAMPU], 'end').events;
    expect(sawSignal(withSignal)).toBe(true);
  });
  it('false pada jalannya tanpa alat (tak ada yang mengirim sinyal)', () => {
    expect(sawSignal(runTo([], 'end').events)).toBe(false);
  });
});