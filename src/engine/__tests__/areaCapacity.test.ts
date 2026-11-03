import { describe, it, expect } from 'vitest';
import { Engine } from '../engine';
import { computeMetrics } from '../metrics';
import type { EngineConfig } from '../types';

describe('Area berkapasitas di Engine (T-041)', () => {
  const makeAreaConfig = (options?: {
    withSemaphore?: boolean;
    cores?: number;
    script?: string[];
  }): EngineConfig => {
    const withSem = options?.withSemaphore ?? false;
    const threads = ['A', 'B', 'C', 'D'].map((id) => ({
      id,
      label: `Robot ${id}`,
      program: [
        ...(withSem ? [{ op: 'SEM_WAIT' as const, sem: 'kartu' }] : []),
        { op: 'ENTER_AREA' as const, area: 'aula' },
        { op: 'WORK' as const, ticks: 2 },
        { op: 'LEAVE_AREA' as const, area: 'aula' },
        ...(withSem ? [{ op: 'SEM_SIGNAL' as const, sem: 'kartu' }] : []),
      ],
    }));

    return {
      threads,
      sharedVars: {},
      mutexes: [],
      semaphores: withSem ? { kartu: 3 } : {},
      conditions: [],
      areas: { aula: 3 },
      scheduler: options?.script
        ? { kind: 'scripted', cores: 1, script: options.script }
        : { kind: 'random', cores: options?.cores ?? 4 },
      maxTicks: 100,
    };
  };

  it('tanpa pengaman: 4 robot masuk area berkapasitas 3 memicu event AREA_OVERLOAD dan overloadTicks bertambah', () => {
    const engine = new Engine();
    // 4 robot langsung masuk area secara bersamaan
    engine.load(makeAreaConfig({ withSemaphore: false, cores: 4 }), 1);

    let overloadEvents = 0;
    while (!engine.isFinished) {
      const stepResult = engine.step();
      for (const event of stepResult.events) {
        if (event.type === 'AREA_OVERLOAD') {
          overloadEvents += 1;
          expect(event.area).toBe('aula');
          expect(event.capacity).toBe(3);
          expect(event.count).toBe(4);
        }
      }
    }

    const snap = engine.getSnapshot();
    expect(overloadEvents).toBeGreaterThan(0);
    expect(snap.overloadTicks).toBeGreaterThan(0);

    const metrics = computeMetrics(snap);
    expect(metrics.overloadTicks).toBe(snap.overloadTicks);
    expect(metrics.areaUtilization).toBeGreaterThan(0);
  });

  it('dengan semaphore kapasitas 3: tidak pernah terjadi AREA_OVERLOAD dan overloadTicks === 0', () => {
    const engine = new Engine();
    engine.load(makeAreaConfig({ withSemaphore: true, cores: 4 }), 1);

    let hasOverload = false;
    while (!engine.isFinished) {
      const stepResult = engine.step();
      if (stepResult.events.some((e) => e.type === 'AREA_OVERLOAD')) {
        hasOverload = true;
      }
    }

    const snap = engine.getSnapshot();
    expect(hasOverload).toBe(false);
    expect(snap.overloadTicks).toBe(0);

    const metrics = computeMetrics(snap);
    expect(metrics.overloadTicks).toBe(0);
    expect(metrics.areaUtilization).toBeGreaterThan(0);
    expect(metrics.areaUtilization).toBeLessThanOrEqual(1);
  });

  it('memancarkan AREA_ENTERED saat masuk dan AREA_LEFT saat keluar', () => {
    const engine = new Engine();
    engine.load(
      makeAreaConfig({
        withSemaphore: false,
        script: ['A', 'A', 'A', 'A'], // A: ENTER_AREA, WORK 1, WORK 2, LEAVE_AREA
      }),
      1,
    );

    // Tick 1: A masuk area
    const step1 = engine.step();
    expect(
      step1.events.some(
        (e) =>
          e.type === 'AREA_ENTERED' && e.thread === 'A' && e.area === 'aula',
      ),
    ).toBe(true);

    engine.step(); // WORK
    engine.step(); // WORK

    // Tick 4: A keluar area
    const step4 = engine.step();
    expect(
      step4.events.some(
        (e) => e.type === 'AREA_LEFT' && e.thread === 'A' && e.area === 'aula',
      ),
    ).toBe(true);
  });
});
