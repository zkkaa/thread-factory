import { describe, expect, it } from 'vitest';
import { SimulationController } from '../../controller/SimulationController';
import { level1_2 } from '../../levels/module1/level-1-2';
import { buildSharedMutexTool } from '../doorSlots';
import { deriveResultView } from '../resultView';

const clock = { requestFrame: () => 1, cancelFrame: () => {} };

/** Jalankan level 1-2 (seed tutorial) dengan pintu masuk/keluar tertentu. */
function runWithDoor(entry: number, exit: number) {
  const controller = new SimulationController(undefined, clock);
  controller.loadLevel(level1_2);
  controller.placeTool(
    buildSharedMutexTool('papan', ['A', 'B'], { entry, exit }) ??
      (() => {
        throw new Error('alat tidak terbentuk');
      })(),
  );
  for (let i = 0; i < 5000; i++) {
    if (controller.getState().runState === 'finished') break;
    controller.step();
  }
  const { level, snapshot, result } = controller.getState();
  if (level === null || snapshot === null || result === null) {
    throw new Error('simulasi belum selesai');
  }
  return deriveResultView(level, snapshot, result);
}

describe('Level 1-2: pesan dan kriteria menurut bintang', () => {
  it('pintu pas (masuk 1, keluar 4): ★★★ dan pesan pass', () => {
    const view = runWithDoor(1, 4);
    expect(view.stars).toBe(3);
    expect(view.explanation).toBe(level1_2.explanation?.pass);
    expect(view.criteria[2]?.label).toContain('tick atau kurang');
    expect(view.criteria[2]?.met).toBe(true);
  });

  it('pintu terlalu besar (masuk 0, keluar 4): bukan ★★★ dan pesan partial', () => {
    const view = runWithDoor(0, 4);
    expect(view.stars).not.toBe(3);
    expect(view.explanation).toBe(level1_2.explanation?.partial);
    expect(view.criteria[2]?.met).toBe(false);
  });
});
