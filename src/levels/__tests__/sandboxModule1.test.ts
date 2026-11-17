import { describe, expect, it } from 'vitest';
import { SimulationController } from '../../controller/SimulationController';
import {
  buildSharedMutexTool,
  buildSharedSemaphoreTool,
} from '../../ui/doorSlots';
import { findLevelById } from '..';
import {
  SANDBOX_PARAMS,
  applySandboxParams,
  defaultSandboxValues,
  isSandboxSupported,
} from '../sandbox';

function levelOf(id: string) {
  const level = findLevelById(id);
  if (level === undefined) throw new Error(`Level ${id} tidak ada.`);
  return level;
}

function runToEnd(controller: SimulationController): void {
  for (let i = 0; i < 10000; i += 1) {
    if (controller.getState().runState === 'finished') return;
    controller.step();
  }
}

describe('Sandbox Modul 1: data parameter', () => {
  it.each(['1-1', '1-2', '1-3'])('level %s didukung', (id) => {
    expect(isSandboxSupported(id)).toBe(true);
  });

  it.each(['1-1', '1-2', '1-3'])(
    'level %s: nilai awal sama dengan data level dan dalam rentang',
    (id) => {
      const level = levelOf(id);
      for (const def of SANDBOX_PARAMS[id] ?? []) {
        if (def.kind !== 'number') continue;
        expect(def.min).toBeLessThanOrEqual(def.initial);
        expect(def.initial).toBeLessThanOrEqual(def.max);
        if (def.key === 'repeat') {
          expect(def.initial).toBe(level.threads[0]?.repeat);
        }
        if (def.key === 'cores') {
          expect(def.initial).toBe(level.scheduler.cores);
        }
      }
    },
  );

  it('tanpa perubahan, level 1-1 setara dengan aslinya', () => {
    const level = levelOf('1-1');
    const { level: copy } = applySandboxParams(level, defaultSandboxValues('1-1'));
    expect(copy.goal.target.value).toBe(10);
    expect(copy.threads.map((t) => t.repeat)).toEqual([5, 5]);
    expect(copy.scheduler).toEqual(level.scheduler);
  });

  it('level asli tidak termutasi', () => {
    const level = levelOf('1-1');
    applySandboxParams(level, { repeat: 2, cores: 2 });
    expect(level.threads[0]?.repeat).toBe(5);
    expect(level.goal.target.value).toBe(10);
    expect(level.scheduler.cores).toBe(1);
  });

  it('nilai di luar rentang ditolak', () => {
    const level = levelOf('1-1');
    expect(() => applySandboxParams(level, { repeat: 0 })).toThrow();
    expect(() => applySandboxParams(level, { repeat: 11 })).toThrow();
    expect(() => applySandboxParams(level, { cores: 3 })).toThrow();
  });
});

describe('Sandbox Modul 1: simulasi', () => {
  it.each(['1-1', '1-2'])(
    'level %s: target ikut jumlah produk dan mutex pas lulus',
    (id) => {
      const level = levelOf(id);
      const { level: sandbox } = applySandboxParams(level, { repeat: 3 });
      expect(sandbox.goal.target.value).toBe(6);

      const controller = new SimulationController();
      controller.loadLevel(sandbox, undefined, { rated: false });
      controller.placeTool(
        buildSharedMutexTool('papan', ['A', 'B'], { entry: 1, exit: 4 }) ?? (() => {
          throw new Error('alat null');
        })(),
      );
      runToEnd(controller);

      const state = controller.getState();
      expect(state.snapshot?.sharedVars.stok).toBe(6);
      expect(state.result?.ok).toBe(true);
      expect(state.result?.stars).toBeNull();
    },
  );

  it('level 1-3: Kartu Akses 3 lulus, tanpa gerbang bentrok', () => {
    const level = levelOf('1-3');
    const { level: sandbox } = applySandboxParams(level, defaultSandboxValues('1-3'));
    const ids = sandbox.threads.map((t) => t.id);

    const withGate = new SimulationController();
    withGate.loadLevel(sandbox, undefined, { rated: false });
    const tool = buildSharedSemaphoreTool('kartu', 3, ids, { entry: 1, exit: 4 });
    if (tool === null) throw new Error('alat null');
    withGate.placeTool(tool);
    runToEnd(withGate);
    expect(withGate.getState().result?.ok).toBe(true);
    expect(withGate.getState().result?.stars).toBeNull();

    const noGate = new SimulationController();
    noGate.loadLevel(sandbox, undefined, { rated: false });
    runToEnd(noGate);
    expect(noGate.getState().result?.ok).toBe(false);
  });
});