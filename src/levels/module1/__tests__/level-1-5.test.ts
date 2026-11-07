import { describe, expect, it } from 'vitest';
import { buildEngineConfig } from '../../../controller/buildEngineConfig';
import { evaluateLevel } from '../../../controller/evaluateLevel';
import { Engine } from '../../../engine/engine';
import type {
  PlacedConditionTool,
  PlacedMutexTool,
  PlacedSemaphoreTool,
  PlacedTool,
} from '../../../engine/tools';
import { level1_5 } from '../level-1-5';

const MUTEX: PlacedMutexTool = {
  id: 'mutex:meja',
  kind: 'mutex',
  mutex: 'meja',
  spans: level1_5.threads.map((thread) => ({
    thread: thread.id,
    start: 1,
    end: 3,
  })),
};

function semaphore(value: number): PlacedSemaphoreTool {
  return {
    id: 'semaphore:kartu',
    kind: 'semaphore',
    sem: 'kartu',
    value,
    spans: level1_5.threads.map((thread) => ({
      thread: thread.id,
      start: 4,
      end: 6,
    })),
  };
}

function condition(slot = 4): PlacedConditionTool {
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

function play(tools: PlacedTool[] = [MUTEX, semaphore(1), condition()]) {
  const engine = new Engine();
  engine.load(buildEngineConfig(level1_5, tools), level1_5.tutorialSeed ?? 10);
  while (!engine.isFinished) engine.step();
  const snapshot = engine.getSnapshot();
  return { snapshot, result: evaluateLevel(level1_5, snapshot) };
}

describe('Level 1-5: Lini Gabungan (T-047)', () => {
  it('menyediakan tiga peran, area berkapasitas, dan semua alat Modul 1', () => {
    expect(level1_5.threads.map((thread) => thread.label)).toEqual([
      'Perakit',
      'Penggudang',
      'Pengepak',
    ]);
    expect(level1_5.areas).toEqual({ aula: 1 });
    expect(level1_5.availableTools).toEqual([
      'mutex',
      'semaphore',
      'condition',
    ]);
    expect(level1_5.resources.map((resource) => resource.kind)).toEqual([
      'mutex',
      'semaphore',
      'condition',
    ]);
  });

  it('kombinasi mutex, semaphore 1, dan sinyal sesudah WRITE lulus', () => {
    const { snapshot, result } = play();

    expect(
      snapshot.threads.every((thread) => thread.state === 'TERMINATED'),
    ).toBe(true);
    expect(snapshot.sharedVars['barang']).toBe(5);
    expect(snapshot.overloadTicks).toBe(0);
    expect(snapshot.busyWaitTicks).toBe(0);
    expect(result.ok).toBe(true);
    expect(result.stars).toBe(3);
  });

  it('tanpa mutex: pembaruan stok yang saling bertumpuk membuat misi gagal', () => {
    const { snapshot, result } = play([semaphore(1), condition()]);

    expect(snapshot.sharedVars['barang']).not.toBe(5);
    expect(result.ok).toBe(false);
  });

  it('tanpa semaphore: area bersama dapat kelebihan kapasitas', () => {
    const { snapshot, result } = play([MUTEX, condition()]);

    expect(snapshot.overloadTicks).toBeGreaterThan(0);
    expect(result.ok).toBe(false);
  });

  it('tanpa condition variable: Pengepak melakukan busy waiting', () => {
    const { snapshot, result } = play([MUTEX, semaphore(1)]);

    expect(snapshot.busyWaitTicks).toBeGreaterThan(0);
    expect(result.ok).toBe(false);
  });

  it('nilai semaphore di atas kapasitas aula memicu bentrok', () => {
    const { snapshot, result } = play([MUTEX, semaphore(2), condition()]);

    expect(snapshot.overloadTicks).toBeGreaterThan(0);
    expect(result.ok).toBe(false);
  });

  it('materi T-095 berisi intro, petunjuk, konsep, dan penjelasan lengkap', () => {
    const intro = level1_5.intro.map((page) => page.text).join(' ');
    const hints = level1_5.hints.join(' ');
    const explanation = `${level1_5.explanation?.pass} ${level1_5.explanation?.fail}`;

    expect(level1_5.intro).toHaveLength(3);
    expect(intro).toContain('Bintang pertama');
    expect(intro).toContain('70 tick');
    expect(intro).toContain('80 tick');
    expect(hints).toContain('mutex');
    expect(hints).toContain('semaphore');
    expect(hints).toContain('condition variable');
    expect(level1_5.concepts.length).toBeGreaterThanOrEqual(4);
    expect(explanation).toContain('lost update');
    expect(explanation).toContain('busy waiting');
  });
});
