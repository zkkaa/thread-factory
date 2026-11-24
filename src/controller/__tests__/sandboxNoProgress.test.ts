import { describe, expect, it } from 'vitest';
import { findLevelById } from '../../levels';
import { applySandboxParams, defaultSandboxValues } from '../../levels/sandbox';
import { planSandbox } from '../../ui/sandboxPanel';
import { startProgressRecorder } from '../../ui/progressRecorder';
import {
  PROGRESS_KEY,
  ProgressStore,
  parseProgress,
} from '../../progress/progressStore';
import { createMemoryStorage } from '../../progress/storage';
import { SimulationController } from '../SimulationController';

const MAX_STEPS = 10000;

/** Maju per tick sampai selesai; berhenti bila macet agar tes tidak menggantung. */
function runToEnd(controller: SimulationController): void {
  for (let i = 0; i < MAX_STEPS; i += 1) {
    if (controller.getState().runState === 'finished') return;
    controller.step();
  }
}

function setup(levelId: string) {
  const level = findLevelById(levelId);
  if (level === undefined) throw new Error(`Level ${levelId} tidak ada.`);
  const storage = createMemoryStorage();
  const store = new ProgressStore(storage);
  const controller = new SimulationController();
  const stop = startProgressRecorder(controller, store);
  return { level, storage, controller, stop };
}

const savedLevels = (storage: ReturnType<typeof createMemoryStorage>) =>
  Object.keys(parseProgress(storage.getItem(PROGRESS_KEY)).levels);

describe('Sandbox tidak mencatat progres', () => {
  it.each(['2-1', '2-2'])('level %s: bintang null dan progres kosong', (id) => {
    const { level, storage, controller, stop } = setup(id);
    const plan = planSandbox(level, defaultSandboxValues(id));
    if (!plan.ok) throw new Error(plan.message);

    controller.loadLevel(plan.level, undefined, plan.options);
    runToEnd(controller);

    const state = controller.getState();
    expect(state.runState).toBe('finished');
    expect(state.result?.stars).toBeNull();
    expect(savedLevels(storage)).toEqual([]);
    stop();
  });

  it('tetap tanpa bintang setelah reset()', () => {
    const { level, storage, controller, stop } = setup('2-1');
    const plan = planSandbox(level, defaultSandboxValues('2-1'));
    if (!plan.ok) throw new Error(plan.message);

    controller.loadLevel(plan.level, undefined, plan.options);
    runToEnd(controller);
    controller.reset();
    runToEnd(controller);

    expect(controller.getState().runState).toBe('finished');
    expect(controller.getState().result?.stars).toBeNull();
    expect(savedLevels(storage)).toEqual([]);
    stop();
  });

  it('kontrol: loadLevel tanpa opsi pada seed tutorial memberi bintang', () => {
    // Memastikan tes di atas bermakna: bintang null berasal dari rated:false,
    // bukan dari penyebab lain (mis. seed).
    const { level, controller, stop } = setup('2-1');
    controller.loadLevel(level);
    runToEnd(controller);
    expect(controller.getState().result?.stars).not.toBeNull();
    stop();
  });

  it('kembali ke Kampanye: loadLevel tanpa opsi menilai lagi', () => {
    const { level, controller, stop } = setup('2-1');
    const sandbox = applySandboxParams(level, defaultSandboxValues('2-1'));
    controller.loadLevel(sandbox.level, undefined, { rated: false });
    controller.loadLevel(level);
    runToEnd(controller);
    expect(controller.getState().result?.stars).not.toBeNull();
    stop();
  });
});
