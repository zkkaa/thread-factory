import { describe, expect, it } from 'vitest';
import { Engine } from '../../engine/engine';
import {
  batteryLevel,
  computeMetrics,
  DEFAULT_BATTERY_TICKS,
} from '../../engine/metrics';
import type {
  EngineConfig,
  Instruction,
  SchedulerConfig,
  ThreadDef,
} from '../../engine/types';
import { validateConfig } from '../../engine/validateConfig';

// ---------------------------------------------------------------------------
// Skenario mini Level 1-4: perakit mengisi "barang" sampai 3, pengepak baru
// boleh bekerja setelah ada minimal 3 barang.
// ---------------------------------------------------------------------------

const ASSEMBLER: Instruction[] = [
  { op: 'WORK', ticks: 1 },
  { op: 'READ', from: 'barang', into: 'r' },
  { op: 'COMPUTE', reg: 'r', add: 1 },
  { op: 'WRITE', reg: 'r', to: 'barang' },
];

function assembler(repeat = 3): ThreadDef {
  return { id: 'A', label: 'Perakit', program: ASSEMBLER, repeat };
}

function spinner(atLeast = 3): ThreadDef {
  return {
    id: 'P',
    label: 'Pengepak',
    program: [
      { op: 'SPIN_UNTIL', variable: 'barang', atLeast },
      { op: 'WORK', ticks: 1 },
    ],
  };
}

function config(
  threads: ThreadDef[],
  scheduler: SchedulerConfig = { kind: 'random', cores: 1 },
  overrides: Partial<EngineConfig> = {},
): EngineConfig {
  return {
    threads,
    sharedVars: { barang: 0 },
    mutexes: [],
    semaphores: {},
    conditions: [],
    scheduler,
    maxTicks: 500,
    ...overrides,
  };
}

function run(cfg: EngineConfig, seed = 1): Engine {
  const engine = new Engine();
  engine.load(cfg, seed);
  while (!engine.isFinished) engine.step();
  return engine;
}

describe('SPIN_UNTIL: busy waiting', () => {
  it('menunggu sambil terus mengecek, lalu lanjut setelah kondisi terpenuhi', () => {
    const engine = run(config([assembler(), spinner()]));
    const snap = engine.getSnapshot();
    expect(snap.sharedVars.barang).toBe(3);
    expect(snap.threads.every((t) => t.state === 'TERMINATED')).toBe(true);
    const packer = snap.threads.find((t) => t.id === 'P');
    expect(packer?.busyWaitTicks).toBeGreaterThan(0);
  });

  it('pengepak yang berputar tidak pernah WAITING (tidak tidur)', () => {
    const snap = run(config([assembler(), spinner()])).getSnapshot();
    const packer = snap.threads.find((t) => t.id === 'P');
    expect(packer?.waitTicks).toBe(0);
  });

  it('thread tanpa SPIN_UNTIL tidak pernah menambah busyWaitTicks', () => {
    const snap = run(config([assembler(), spinner()])).getSnapshot();
    const perakit = snap.threads.find((t) => t.id === 'A');
    expect(perakit?.busyWaitTicks).toBe(0);
  });

  it('kondisi sudah terpenuhi sejak awal: tidak ada busy waiting', () => {
    const cfg = config([spinner(3)], undefined, {
      sharedVars: { barang: 5 },
    });
    const snap = run(cfg).getSnapshot();
    expect(snap.busyWaitTicks).toBe(0);
    expect(snap.threads[0]?.state).toBe('TERMINATED');
  });

  it('tiap tick pengecekan yang gagal tetap memakai core (executedInstructions)', () => {
    // Hanya pengepak, tidak ada yang mengisi barang: ia berputar sampai maxTicks.
    const cfg = config(
      [spinner(3)],
      { kind: 'random', cores: 1 },
      {
        maxTicks: 10,
      },
    );
    const engine = new Engine();
    engine.load(cfg, 1);
    for (let i = 0; i < 10; i++) engine.step();
    const snap = engine.getSnapshot();
    expect(snap.executedInstructions).toBe(10);
    expect(snap.busyWaitTicks).toBe(10);
    expect(snap.threads[0]?.pc).toBe(0); // pc tidak maju
  });

  it('busy waiting mencuri jatah core: perakit jadi lebih lambat dibanding tanpa pengepak', () => {
    const tanpa = run(config([assembler()])).getSnapshot().tick;
    const dengan = run(config([assembler(), spinner()])).getSnapshot().tick;
    expect(dengan).toBeGreaterThan(tanpa);
  });

  it('pengepak tidak mulai WORK sebelum barang mencapai batas', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const engine = new Engine();
      engine.load(config([assembler(), spinner(3)]), seed);
      let packed = false;
      while (!engine.isFinished) {
        const { events } = engine.step();
        const started = events.some(
          (e) =>
            e.type === 'INSTRUCTION' && e.thread === 'P' && e.op === 'WORK',
        );
        if (started) {
          packed = true;
          expect(engine.getSnapshot().sharedVars.barang).toBeGreaterThanOrEqual(
            3,
          );
        }
      }
      expect(packed).toBe(true);
    }
  });

  it('SPIN_UNTIL boleh menjadi instruksi terakhir program', () => {
    const last: ThreadDef = {
      id: 'P',
      label: 'Pengepak',
      program: [{ op: 'SPIN_UNTIL', variable: 'barang', atLeast: 3 }],
    };
    expect(() => run(config([assembler(), last]))).not.toThrow();
    const snap = run(config([assembler(), last])).getSnapshot();
    expect(snap.threads.every((t) => t.state === 'TERMINATED')).toBe(true);
  });

  it('deterministik: seed sama menghasilkan busyWaitTicks sama', () => {
    const a = run(config([assembler(), spinner()]), 7).getSnapshot();
    const b = run(config([assembler(), spinner()]), 7).getSnapshot();
    expect(b.busyWaitTicks).toBe(a.busyWaitTicks);
  });
});

describe('blocking vs busy waiting (COND_WAIT tidak menguras)', () => {
  const sleeper: ThreadDef = {
    id: 'P',
    label: 'Pengepak',
    program: [
      { op: 'LOCK', mutex: 'm' },
      { op: 'COND_WAIT', cond: 'c', mutex: 'm' },
      { op: 'UNLOCK', mutex: 'm' },
      { op: 'WORK', ticks: 1 },
    ],
  };
  const signaler: ThreadDef = {
    id: 'A',
    label: 'Perakit',
    program: [
      { op: 'WORK', ticks: 5 },
      { op: 'LOCK', mutex: 'm' },
      { op: 'COND_SIGNAL', cond: 'c' },
      { op: 'UNLOCK', mutex: 'm' },
      { op: 'WORK', ticks: 1 },
    ],
  };

  it('thread yang tidur di condition: waitTicks naik, busyWaitTicks tetap 0', () => {
    // Pengepak jalan duluan sampai tidur, baru perakit bekerja.
    const cfg = config(
      [sleeper, signaler],
      {
        kind: 'scripted',
        cores: 1,
        script: ['P', 'P'],
      },
      { mutexes: ['m'], conditions: ['c'] },
    );
    const snap = run(cfg).getSnapshot();
    const packer = snap.threads.find((t) => t.id === 'P');
    expect(packer?.state).toBe('TERMINATED');
    expect(packer?.waitTicks).toBeGreaterThan(0);
    expect(packer?.busyWaitTicks).toBe(0);
    expect(snap.busyWaitTicks).toBe(0);
  });
});

describe('validateConfig: SPIN_UNTIL', () => {
  it('menolak variabel bersama yang tidak ada', () => {
    const bad: ThreadDef = {
      id: 'P',
      label: 'P',
      program: [{ op: 'SPIN_UNTIL', variable: 'hantu', atLeast: 1 }],
    };
    expect(() => validateConfig(config([bad]))).toThrow(/hantu/);
  });

  it('menolak atLeast yang bukan bilangan hingga', () => {
    const bad: ThreadDef = {
      id: 'P',
      label: 'P',
      program: [{ op: 'SPIN_UNTIL', variable: 'barang', atLeast: NaN }],
    };
    expect(() => validateConfig(config([bad]))).toThrow(/atLeast/);
  });

  it('menerima SPIN_UNTIL yang benar', () => {
    expect(() => validateConfig(config([spinner()]))).not.toThrow();
  });
});

describe('computeMetrics: busyWaitTicks', () => {
  it('sebelum jalan semuanya nol', () => {
    const engine = new Engine();
    engine.load(config([assembler(), spinner()]), 1);
    const m = computeMetrics(engine.getSnapshot());
    expect(m.busyWaitTicks).toBe(0);
    expect(m.busyWaitTicksByThread).toEqual({ A: 0, P: 0 });
  });

  it('total = jumlah per thread, dan hanya pengepak yang menguras', () => {
    const m = computeMetrics(
      run(config([assembler(), spinner()])).getSnapshot(),
    );
    expect(m.busyWaitTicksByThread.A).toBe(0);
    expect(m.busyWaitTicksByThread.P).toBeGreaterThan(0);
    expect(m.busyWaitTicks).toBe(
      (m.busyWaitTicksByThread.A ?? 0) + (m.busyWaitTicksByThread.P ?? 0),
    );
  });
});

describe('batteryLevel', () => {
  it('penuh bila tidak ada busy waiting', () => {
    expect(batteryLevel(0)).toBe(1);
  });

  it('berkurang linear terhadap busyWaitTicks', () => {
    expect(batteryLevel(5, 20)).toBeCloseTo(0.75);
    expect(batteryLevel(10, 20)).toBeCloseTo(0.5);
  });

  it('habis (0) pada kapasitas dan tidak pernah negatif', () => {
    expect(batteryLevel(20, 20)).toBe(0);
    expect(batteryLevel(999, 20)).toBe(0);
  });

  it('memakai kapasitas bawaan bila tidak diberikan', () => {
    expect(batteryLevel(DEFAULT_BATTERY_TICKS)).toBe(0);
  });

  it('nilai negatif diperlakukan sebagai nol', () => {
    expect(batteryLevel(-3)).toBe(1);
  });

  it('menolak kapasitas nol atau negatif', () => {
    expect(() => batteryLevel(1, 0)).toThrow();
    expect(() => batteryLevel(1, -5)).toThrow();
  });
});
