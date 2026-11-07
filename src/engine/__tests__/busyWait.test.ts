import { describe, it, expect } from 'vitest';
import { Engine } from '../engine';
import { computeMetrics } from '../metrics';
import type { EngineConfig, Instruction } from '../types';

const spin = (atLeast = 1): Instruction => ({
  op: 'SPIN_UNTIL',
  variable: 'stok',
  atLeast,
});

function config(over: Partial<EngineConfig>): EngineConfig {
  return {
    threads: [],
    sharedVars: { stok: 0 },
    mutexes: [],
    semaphores: {},
    conditions: [],
    scheduler: { kind: 'random', cores: 1 },
    maxTicks: 100,
    ...over,
  };
}

function runAll(engine: Engine): void {
  let guard = 0;
  while (!engine.isFinished && guard++ < 200) engine.step();
}

describe('SPIN_UNTIL (busy waiting)', () => {
  it('langsung selesai bila variabel sudah terpenuhi: busyWaitTicks 0', () => {
    const engine = new Engine();
    engine.load(
      config({
        sharedVars: { stok: 5 },
        threads: [
          {
            id: 'P',
            label: 'Pengepak',
            program: [spin(3), { op: 'WORK', ticks: 1 }],
          },
        ],
      }),
      1,
    );
    runAll(engine);
    const snap = engine.getSnapshot();
    expect(snap.threads[0]?.state).toBe('TERMINATED');
    expect(computeMetrics(snap).busyWaitTicks).toBe(0);
  });

  it('mengecek berulang dan menghitung tick terbuang sampai perakit mengisi stok', () => {
    const engine = new Engine();
    engine.load(
      config({
        threads: [
          {
            id: 'P',
            label: 'Pengepak',
            program: [spin(), { op: 'WORK', ticks: 1 }],
          },
          {
            id: 'Q',
            label: 'Perakit',
            program: [
              { op: 'READ', from: 'stok', into: 'r' },
              { op: 'COMPUTE', reg: 'r', add: 1 },
              { op: 'WRITE', reg: 'r', to: 'stok' },
            ],
          },
        ],
        scheduler: {
          kind: 'scripted',
          cores: 1,
          script: ['P', 'P', 'P', 'Q', 'Q', 'Q', 'P', 'P'],
        },
      }),
      1,
    );
    runAll(engine);
    const snap = engine.getSnapshot();
    const m = computeMetrics(snap);
    expect(snap.sharedVars.stok).toBe(1);
    expect(snap.threads.every((t) => t.state === 'TERMINATED')).toBe(true);
    expect(m.busyWaitTicksByThread).toEqual({ P: 3, Q: 0 });
    expect(m.busyWaitTicks).toBe(3);
    // Busy waiting memakai core, bukan WAITING.
    expect(m.waitTicksByThread.P).toBe(0);
  });

  it('tidak pernah terpenuhi: berhenti di maxTicks dan semua tick terbuang', () => {
    const engine = new Engine();
    engine.load(
      config({
        threads: [
          {
            id: 'P',
            label: 'Pengepak',
            program: [spin(), { op: 'WORK', ticks: 1 }],
          },
        ],
        maxTicks: 5,
      }),
      1,
    );
    runAll(engine);
    const snap = engine.getSnapshot();
    expect(snap.tick).toBe(5);
    expect(snap.threads[0]?.state).not.toBe('TERMINATED');
    expect(computeMetrics(snap).busyWaitTicks).toBe(5);
  });

  it('kontras: COND_WAIT membuat thread tidur (WAITING) dan busyWaitTicks tetap 0', () => {
    const engine = new Engine();
    engine.load(
      config({
        mutexes: ['m'],
        conditions: ['c'],
        threads: [
          {
            id: 'P',
            label: 'Pengepak',
            program: [
              { op: 'LOCK', mutex: 'm' },
              { op: 'COND_WAIT', cond: 'c', mutex: 'm' },
              { op: 'UNLOCK', mutex: 'm' },
              { op: 'WORK', ticks: 1 },
            ],
          },
          {
            id: 'Q',
            label: 'Perakit',
            program: [
              { op: 'LOCK', mutex: 'm' },
              { op: 'READ', from: 'stok', into: 'r' },
              { op: 'COMPUTE', reg: 'r', add: 1 },
              { op: 'WRITE', reg: 'r', to: 'stok' },
              { op: 'COND_SIGNAL', cond: 'c' },
              { op: 'UNLOCK', mutex: 'm' },
            ],
          },
        ],
        scheduler: {
          kind: 'scripted',
          cores: 1,
          script: ['P', 'P', 'Q', 'Q', 'Q', 'Q', 'Q', 'Q', 'P', 'P'],
        },
      }),
      1,
    );
    runAll(engine);
    const snap = engine.getSnapshot();
    const m = computeMetrics(snap);
    expect(snap.threads.every((t) => t.state === 'TERMINATED')).toBe(true);
    expect(m.busyWaitTicks).toBe(0);
    expect(m.waitTicksByThread.P).toBeGreaterThan(0);
  });

  it('validateConfig menolak variabel yang tidak ada dan atLeast tidak hingga', () => {
    const bad = (program: Instruction[]) =>
      config({ threads: [{ id: 'P', label: 'P', program }] });
    expect(() =>
      new Engine().load(
        bad([
          { op: 'SPIN_UNTIL', variable: 'hantu', atLeast: 1 },
          { op: 'WORK', ticks: 1 },
        ]),
        1,
      ),
    ).toThrow(/tidak ada/);
    expect(() =>
      new Engine().load(
        bad([
          { op: 'SPIN_UNTIL', variable: 'stok', atLeast: Infinity },
          { op: 'WORK', ticks: 1 },
        ]),
        1,
      ),
    ).toThrow(/bilangan hingga/);
  });
});
