import { describe, expect, it } from 'vitest';
import { SimulationController } from '../../../controller/SimulationController';
import type { RwPolicy } from '../../../engine/primitives/rwlock';
import { buildRwTool, findRwSetup } from '../../../ui/rwTool';
import { level2_2 } from '../level-2-2';

function playSeed1(policy: RwPolicy) {
  const setup = findRwSetup(level2_2);
  if (setup === null) throw new Error('Level 2-2 tanpa setup rwlock');
  const controller = new SimulationController();
  controller.loadLevel(level2_2, level2_2.tutorialSeed);
  controller.placeTool(buildRwTool(setup, policy));
  for (let i = 0; i < 2000 && controller.getState().runState !== 'finished'; i++) {
    controller.step();
  }
  return controller.getState().result;
}

describe('Level 2-2: bintang pada seed tutorial', () => {
  it('reader priority gagal karena penulis kelaparan', () => {
    const result = playSeed1('reader');
    expect(result?.ok).toBe(false);
    expect(result?.stars).toBe(0);
  });

  it('writer priority benar tetapi tidak cepat (1 bintang)', () => {
    const result = playSeed1('writer');
    expect(result?.ok).toBe(true);
    expect(result?.stars).toBe(1);
  });

  it('fair benar, cepat, dan hemat (3 bintang)', () => {
    const result = playSeed1('fair');
    expect(result?.ok).toBe(true);
    expect(result?.stars).toBe(3);
  });
});
