import { describe, expect, it } from 'vitest';
import { Engine } from '../../../engine/engine';
import { applyTools, type PlacedTool } from '../../../engine/tools';
import type { EngineConfig } from '../../../engine/types';
import { evaluateLevel } from '../../../controller/evaluateLevel';
import { level1_2 } from '../level-1-2';

type Door = [start: number, end: number] | null;

function run(cores: number, door: Door, seed: number) {
  const tools: PlacedTool[] =
    door === null
      ? []
      : [
          {
            id: 'pintu',
            kind: 'mutex',
            mutex: 'papan',
            spans: level1_2.threads.map((t) => ({
              thread: t.id,
              start: door[0],
              end: door[1],
            })),
          },
        ];
  const config: EngineConfig = {
    threads: applyTools(level1_2.threads, tools),
    sharedVars: { ...level1_2.sharedVars },
    mutexes: ['papan'],
    semaphores: {},
    conditions: [],
    scheduler: { kind: 'random', cores },
    maxTicks: 2000,
  };
  const engine = new Engine();
  engine.load(config, seed);
  while (!engine.isFinished) engine.step();
  return engine.getSnapshot();
}

const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);

describe('Level 1-2: Pintu Kebesaran (T-038)', () => {
  it('memakai 2 core dan terdaftar dengan layout sendiri', () => {
    expect(level1_2.scheduler.cores).toBe(2);
    expect(level1_2.layoutId).toBe('1-2');
  });

  it('tanpa pintu, stok salah (race condition) pada semua seed', () => {
    for (const seed of SEEDS) {
      expect(run(2, null, seed).sharedVars.stok, `seed ${seed}`).not.toBe(10);
    }
  });

  it('pintu pas (READ sampai WRITE): stok benar pada semua seed', () => {
    for (const seed of SEEDS) {
      expect(run(2, [1, 3], seed).sharedVars.stok, `seed ${seed}`).toBe(10);
    }
  });

  it('pintu terlalu besar (menutupi WORK): stok tetap benar tetapi lebih lambat', () => {
    for (const seed of SEEDS) {
      const wide = run(2, [0, 3], seed);
      const tight = run(2, [1, 3], seed);
      expect(wide.sharedVars.stok, `seed ${seed}`).toBe(10);
      expect(wide.tick, `seed ${seed}`).toBeGreaterThan(tight.tick);
    }
  });

  it('pada 1 core total tick sama berapa pun besar pintu (alasan memakai 2 core)', () => {
    for (const seed of SEEDS) {
      const wide = run(1, [0, 3], seed);
      const tight = run(1, [1, 3], seed);
      expect(wide.tick, `seed ${seed}`).toBe(tight.tick);
    }
  });

  describe('evaluateLevel Level 1-2 (T-039)', () => {
    it('tanpa pintu pada seed tutorial: gagal, 0 bintang', () => {
      const snap = run(2, null, level1_2.tutorialSeed as number);
      const result = evaluateLevel(level1_2, snap);
      expect(result.ok).toBe(false);
      expect(result.stars).toBe(0);
    });

    it('pintu pas [1, 3] pada seed tutorial: lulus 3 bintang (cepat dan hemat)', () => {
      const snap = run(2, [1, 3], level1_2.tutorialSeed as number);
      const result = evaluateLevel(level1_2, snap);
      expect(result.ok).toBe(true);
      expect(result.metrics.tick).toBeLessThanOrEqual(level1_2.goal.stars.fast);
      expect(result.stars).toBe(3);
    });

    it('pintu terlalu besar [0, 3] pada seed tutorial: lulus tapi hanya 1 bintang karena lambat', () => {
      const snap = run(2, [0, 3], level1_2.tutorialSeed as number);
      const result = evaluateLevel(level1_2, snap);
      expect(result.ok).toBe(true);
      expect(result.metrics.tick).toBeGreaterThan(level1_2.goal.stars.fast);
      expect(result.stars).toBe(1);
    });
  });
});
