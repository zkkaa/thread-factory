import { describe, expect, it } from 'vitest';
import { Engine } from '../../../engine/engine';
import { applyTools, type PlacedTool } from '../../../engine/tools';
import type { EngineConfig } from '../../../engine/types';
import { evaluateLevel } from '../../../controller/evaluateLevel';
import { level1_3 } from '../level-1-3';

function runWithSemaphore(semaphoreValue: number | null, seed = 10) {
  const tools: PlacedTool[] =
    semaphoreValue === null
      ? []
      : [
          {
            id: 'sem-kartu',
            kind: 'semaphore',
            sem: 'kartu',
            value: semaphoreValue,
            spans: level1_3.threads.map((t) => ({
              thread: t.id,
              start: 1, // tepat sebelum ENTER_AREA
              end: 3,   // tepat setelah LEAVE_AREA
            })),
          },
        ];

  const semaphores: Record<string, number> = {};
  if (semaphoreValue !== null) {
    semaphores['kartu'] = semaphoreValue;
  }

  const config: EngineConfig = {
    threads: applyTools(level1_3.threads, tools),
    sharedVars: { ...level1_3.sharedVars },
    mutexes: [],
    semaphores,
    conditions: [],
    areas: level1_3.areas,
    scheduler: { kind: 'random', cores: 8 },
    maxTicks: 2000,
  };

  const engine = new Engine();
  engine.load(config, seed);
  while (!engine.isFinished) engine.step();
  return engine.getSnapshot();
}

describe('Level 1-3: Tiga Mesin, Delapan Robot (T-043)', () => {
  it('konfigurasi level valid: 8 robot, 8 core, area aula kapasitas 3', () => {
    expect(level1_3.threads.length).toBe(8);
    expect(level1_3.scheduler.cores).toBe(8);
    expect(level1_3.areas?.aula).toBe(3);
    expect(level1_3.resources).toEqual([
      {
        kind: 'semaphore',
        id: 'kartu',
        initialValue: 3,
        label: 'Kartu Akses Aula',
      },
    ]);
  });

  it('tanpa semaphore: terjadi bentrok (overload) di aula dan invariant gagal', () => {
    const snap = runWithSemaphore(null, 10);
    expect(snap.overloadTicks).toBeGreaterThan(0);
    const evalResult = evaluateLevel(level1_3, snap);
    expect(evalResult.ok).toBe(false);
    expect(evalResult.stars).toBe(0);
  });

  it('nilai semaphore > 3 (misal 4 dan 8): terjadi bentrok di aula dan invariant gagal', () => {
    for (const val of [4, 5, 8]) {
      const snap = runWithSemaphore(val, 10);
      expect(snap.overloadTicks, `nilai ${val}`).toBeGreaterThan(0);
      const evalResult = evaluateLevel(level1_3, snap);
      expect(evalResult.ok, `nilai ${val}`).toBe(false);
    }
  });

  it('nilai semaphore = 3: tidak ada bentrok (overloadTicks === 0), invariant sukses', () => {
    const snap = runWithSemaphore(3, 10);
    expect(snap.overloadTicks).toBe(0);
    expect(snap.finished).toBe(true);
    const evalResult = evaluateLevel(level1_3, snap);
    expect(evalResult.ok).toBe(true);
  });

  it('perbandingan utilisasi: nilai 3 menghasilkan utilisasi lebih tinggi daripada nilai 1 atau 2', () => {
    const snap3 = runWithSemaphore(3, 10);
    const snap2 = runWithSemaphore(2, 10);
    const snap1 = runWithSemaphore(1, 10);

    expect(snap3.overloadTicks).toBe(0);
    expect(snap2.overloadTicks).toBe(0);
    expect(snap1.overloadTicks).toBe(0);

    // Kapasitas 3 memanfaatkan mesin lebih banyak dibanding kapasitas 1 atau 2
    expect(snap3.areaUtilization).toBeGreaterThan(snap2.areaUtilization);
    expect(snap2.areaUtilization).toBeGreaterThan(snap1.areaUtilization);

    // Total tick selesai pada nilai 3 juga lebih cepat dibanding nilai 1 atau 2
    expect(snap3.tick).toBeLessThan(snap2.tick);
    expect(snap2.tick).toBeLessThan(snap1.tick);
  });
});
