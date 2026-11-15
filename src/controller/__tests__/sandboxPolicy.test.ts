import { describe, expect, it } from 'vitest';
import type { RwPolicy } from '../../engine/primitives/rwlock';
import type {
  EngineConfig,
  SimulationEngine,
  Snapshot,
} from '../../engine/types';
import { level2_2 } from '../../levels/module2/level-2-2';
import { SimulationController } from '../SimulationController';

/** Engine palsu: hanya merekam konfigurasi yang diterima load(). */
function fakeEngine() {
  const configs: EngineConfig[] = [];
  const snapshot = { tick: 0, threads: [] } as unknown as Snapshot;
  const engine: SimulationEngine = {
    load: (config) => {
      configs.push(config);
    },
    step: () => ({ tick: 0, events: [], finished: false }),
    reset: () => undefined,
    preempt: () => ({ tick: 0, events: [], finished: false }),
    getSnapshot: () => snapshot,
    isFinished: false,
  };
  return { engine, configs };
}

const last = (configs: EngineConfig[]) => configs[configs.length - 1];

describe('SimulationController: kebijakan kunci Sandbox', () => {
  it('loadLevel meneruskan rwPolicy ke engine', () => {
    const { engine, configs } = fakeEngine();
    const controller = new SimulationController(engine);
    controller.loadLevel(level2_2, undefined, { rwPolicy: 'writer' });
    expect(last(configs)?.rwLocks).toEqual({ 'kunci-papan': 'writer' });
  });

  it('tanpa opsi, kebijakan bawaan level dipakai', () => {
    const { engine, configs } = fakeEngine();
    const controller = new SimulationController(engine);
    controller.loadLevel(level2_2);
    expect(last(configs)?.rwLocks).toEqual({ 'kunci-papan': 'reader' });
  });

  it('reset mempertahankan kebijakan', () => {
    const { engine, configs } = fakeEngine();
    const controller = new SimulationController(engine);
    controller.loadLevel(level2_2, undefined, { rwPolicy: 'fair' });
    controller.reset();
    expect(last(configs)?.rwLocks).toEqual({ 'kunci-papan': 'fair' });
  });

  it('memuat level lagi tanpa opsi menghapus kebijakan lama', () => {
    const { engine, configs } = fakeEngine();
    const controller = new SimulationController(engine);
    const policy: RwPolicy = 'writer';
    controller.loadLevel(level2_2, undefined, { rwPolicy: policy });
    controller.loadLevel(level2_2);
    controller.reset();
    expect(last(configs)?.rwLocks).toEqual({ 'kunci-papan': 'reader' });
  });
});