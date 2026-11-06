import { describe, expect, it } from 'vitest';
import { buildEngineConfig } from '../../../controller/buildEngineConfig';
import { evaluateLevel } from '../../../controller/evaluateLevel';
import { Engine } from '../../../engine/engine';
import type { PlacedConditionTool } from '../../../engine/tools';
import { level1_4 } from '../level-1-4';

function toolAt(slot: number): PlacedConditionTool {
  return {
    id: 'cond-lampu',
    kind: 'condition',
    cond: 'lampu',
    mutex: 'meja',
    waiter: { thread: 'P', index: 0 },
    signaler: { thread: 'A', slot },
    spans: [],
  };
}

function run(slot: number, seed: number) {
  const engine = new Engine();
  engine.load(buildEngineConfig(level1_4, [toolAt(slot)]), seed);
  while (!engine.isFinished) engine.step();
  return evaluateLevel(level1_4, engine.getSnapshot());
}

describe('Level 1-4: waktu menyalakan lampu (T-091)', () => {
  it('sinyal sesudah WRITE (slot 4): lulus pada banyak seed', () => {
    for (let seed = 1; seed <= 50; seed++) {
      expect(run(4, seed).ok, `seed ${seed}`).toBe(true);
    }
  });

  // Slot 2 dan 3 sengaja tidak dites: hasilnya bergantung timing, karena
  // WRITE perakit bisa selesai sebelum pengepak sempat membaca barang.
  it('sinyal jauh sebelum barang cukup (slot 0 dan 1): selalu gagal', () => {
    for (const slot of [0, 1]) {
      for (let seed = 1; seed <= 20; seed++) {
        expect(run(slot, seed).ok, `slot ${slot} seed ${seed}`).toBe(false);
      }
    }
  });

  it('sinyal slot 4 pada seed tutorial: 3 bintang', () => {
    expect(run(4, 10).stars).toBe(3);
  });
});
