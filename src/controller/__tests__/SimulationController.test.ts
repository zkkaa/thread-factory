import { describe, it, expect } from 'vitest';
import type {
  EngineConfig,
  SimEvent,
  SimulationEngine,
  Snapshot,
  StepResult,
} from '../../engine/types';
import { level1_1 } from '../../levels/module1/level-1-1';
import {
  SimulationController,
  TICK_INTERVAL_MS,
  type ControllerState,
} from '../SimulationController';
import { ManualClock } from './manualClock';

/** Menjalankan `count` frame berurutan, masing-masing `ms` milidetik (maks. 250 agar tidak terkena batas frame). */
function advanceFrames(
  clock: ManualClock,
  count: number,
  ms = TICK_INTERVAL_MS,
): void {
  for (let i = 0; i < count; i++) clock.advance(ms);
}

/** Engine palsu: selesai setelah `totalTicks`; melempar error di tick `failAtTick`. */
class FakeEngine implements SimulationEngine {
  loads: { config: EngineConfig; seed: number }[] = [];
  stepCalls = 0;
  private tick = 0;
  private seed = 0;

  constructor(
    private readonly totalTicks = 100,
    private readonly failAtTick: number | null = null,
  ) {}

  get isFinished(): boolean {
    return this.tick >= this.totalTicks;
  }

  load(config: EngineConfig, seed: number): void {
    if (seed < 0) throw new RangeError('seed tidak valid');
    this.loads.push({ config, seed });
    this.seed = seed;
    this.tick = 0;
  }

  reset(): void {
    throw new Error('controller tidak boleh memakai engine.reset()');
  }

  step(): StepResult {
    this.stepCalls += 1;
    this.tick += 1;
    if (this.failAtTick === this.tick)
      throw new Error('UNLOCK oleh non-pemilik');
    // Bentuk event tidak penting untuk tes controller; yang dihitung jumlahnya.
    const events: SimEvent[] = [{ type: 'FINISHED', tick: this.tick }];
    return { tick: this.tick, events, finished: this.isFinished };
  }

  getSnapshot(): Readonly<Snapshot> {
    return {
      tick: this.tick,
      seed: this.seed,
      finished: this.isFinished,
      threads: [],
      sharedVars: {},
      mutexes: [],
      semaphores: [],
      conditions: [],
      cores: 1,
      executedInstructions: 0,
    };
  }
}

function setup(totalTicks = 100, failAtTick: number | null = null) {
  const engine = new FakeEngine(totalTicks, failAtTick);
  const clock = new ManualClock();
  const controller = new SimulationController(engine, clock);
  return { engine, clock, controller };
}

/** run() lalu frame acuan (waktu 0), supaya advance() berikutnya langsung menghitung tick. */
function startRunning(s: ReturnType<typeof setup>): void {
  s.controller.run();
  s.clock.advance(0);
}

const tickOf = (c: SimulationController): number =>
  c.getState().snapshot?.tick ?? -1;

describe('SimulationController: sebelum level dimuat', () => {
  it('semua perintah diabaikan tanpa error', () => {
    const { controller, engine, clock } = setup();
    controller.run();
    controller.step();
    controller.pause();
    controller.reset();
    expect(controller.getState().runState).toBe('idle');
    expect(controller.getState().snapshot).toBeNull();
    expect(engine.stepCalls).toBe(0);
    expect(clock.pendingCount).toBe(0);
  });
});

describe('loadLevel', () => {
  it('memuat engine dengan tutorialSeed dan config dari level', () => {
    const { controller, engine } = setup();
    controller.loadLevel(level1_1);
    expect(engine.loads).toHaveLength(1);
    expect(engine.loads[0].seed).toBe(10);
    expect(engine.loads[0].config.mutexes).toEqual(['papan']);
    const state = controller.getState();
    expect(state.runState).toBe('idle');
    expect(state.level).toBe(level1_1);
    expect(state.snapshot?.tick).toBe(0);
    expect(state.seed).toBe(10);
  });

  it('seed eksplisit mengalahkan tutorialSeed', () => {
    const { controller, engine } = setup();
    controller.loadLevel(level1_1, 77);
    expect(engine.loads[0].seed).toBe(77);
    expect(controller.getState().seed).toBe(77);
  });

  it('bila engine menolak seed, state lama tetap utuh', () => {
    const { controller } = setup();
    controller.loadLevel(level1_1, 5);
    expect(() => controller.loadLevel(level1_1, -1)).toThrow(RangeError);
    expect(controller.getState().seed).toBe(5);
    expect(controller.getState().runState).toBe('idle');
  });
});

describe('step manual', () => {
  it('dari idle: maju satu tick dan berstatus paused', () => {
    const { controller } = setup();
    controller.loadLevel(level1_1);
    controller.step();
    expect(tickOf(controller)).toBe(1);
    expect(controller.getState().runState).toBe('paused');
    expect(controller.getState().events).toHaveLength(1);
    controller.step();
    expect(tickOf(controller)).toBe(2);
  });

  it('diabaikan saat running', () => {
    const s = setup();
    s.controller.loadLevel(level1_1);
    startRunning(s);
    s.controller.step();
    expect(s.engine.stepCalls).toBe(0);
  });

  it('tick terakhir membuat state finished; step berikutnya diabaikan', () => {
    const { controller, engine } = setup(2);
    controller.loadLevel(level1_1);
    controller.step();
    controller.step();
    expect(controller.getState().runState).toBe('finished');
    controller.step();
    expect(engine.stepCalls).toBe(2);
  });
});

describe('run dan jam tick', () => {
  it('frame pertama hanya acuan; 4 tick per detik pada 1x', () => {
    const s = setup();
    s.controller.loadLevel(level1_1);
    s.controller.run();
    expect(s.controller.getState().runState).toBe('running');
    s.clock.advance(0);
    expect(tickOf(s.controller)).toBe(0);
    s.clock.advance(TICK_INTERVAL_MS);
    expect(tickOf(s.controller)).toBe(1);
    advanceFrames(s.clock, 4);
    expect(tickOf(s.controller)).toBe(1 + 4);
  });

  it('sisa waktu terakumulasi antar frame', () => {
    const s = setup();
    s.controller.loadLevel(level1_1);
    startRunning(s);
    s.clock.advance(100);
    s.clock.advance(100);
    expect(tickOf(s.controller)).toBe(0);
    s.clock.advance(50); // total 250 ms
    expect(tickOf(s.controller)).toBe(1);
  });

  it('kecepatan 5x memberi 5 tick dalam satu selang, dikirim sebagai satu notifikasi', () => {
    const s = setup();
    s.controller.loadLevel(level1_1);
    s.controller.setSpeed(5);
    startRunning(s);
    let notifications = 0;
    let lastEvents = 0;
    s.controller.subscribe((state) => {
      notifications += 1;
      lastEvents = state.events.length;
    });
    s.clock.advance(TICK_INTERVAL_MS);
    expect(tickOf(s.controller)).toBe(5);
    expect(notifications).toBe(1);
    expect(lastEvents).toBe(5);
  });

  it('kecepatan 0.5x: satu tick per dua selang', () => {
    const s = setup();
    s.controller.loadLevel(level1_1);
    s.controller.setSpeed(0.5);
    startRunning(s);
    s.clock.advance(TICK_INTERVAL_MS);
    expect(tickOf(s.controller)).toBe(0);
    s.clock.advance(TICK_INTERVAL_MS);
    expect(tickOf(s.controller)).toBe(1);
  });

  it('frame yang sangat lambat dibatasi (tab disembunyikan)', () => {
    const s = setup();
    s.controller.loadLevel(level1_1);
    startRunning(s);
    s.clock.advance(60_000);
    expect(tickOf(s.controller)).toBe(1); // 250 ms maksimum = 1 tick pada 1x
  });

  it('run() dua kali tidak membuat dua loop', () => {
    const s = setup();
    s.controller.loadLevel(level1_1);
    s.controller.run();
    s.controller.run();
    expect(s.clock.pendingCount).toBe(1);
  });

  it('simulasi selesai: jam berhenti, event FINISHED diterima, run() diabaikan', () => {
    const s = setup(3);
    s.controller.loadLevel(level1_1);
    s.controller.setSpeed(5);
    startRunning(s);
    s.clock.advance(1000);
    expect(tickOf(s.controller)).toBe(3);
    expect(s.controller.getState().runState).toBe('finished');
    expect(s.clock.pendingCount).toBe(0);
    s.controller.run();
    expect(s.controller.getState().runState).toBe('finished');
    expect(s.clock.pendingCount).toBe(0);
    expect(s.engine.stepCalls).toBe(3);
  });
});

describe('pause dan lanjut', () => {
  it('pause menghentikan jam; run melanjutkan dari tick yang sama', () => {
    const s = setup();
    s.controller.loadLevel(level1_1);
    startRunning(s);
    advanceFrames(s.clock, 2);
    expect(tickOf(s.controller)).toBe(2);

    s.controller.pause();
    expect(s.controller.getState().runState).toBe('paused');
    expect(s.clock.pendingCount).toBe(0);
    s.clock.advance(5000);
    expect(tickOf(s.controller)).toBe(2);

    startRunning(s);
    s.clock.advance(TICK_INTERVAL_MS);
    expect(tickOf(s.controller)).toBe(3);
  });

  it('pause saat idle atau paused tidak berpengaruh', () => {
    const { controller } = setup();
    controller.loadLevel(level1_1);
    const before = controller.getState();
    controller.pause();
    expect(controller.getState()).toBe(before);
  });
});

describe('reset', () => {
  it('kembali ke idle, tick 0, seed sama, jam berhenti, kecepatan dipertahankan', () => {
    const s = setup();
    s.controller.loadLevel(level1_1, 5);
    s.controller.setSpeed(5);
    startRunning(s);
    s.clock.advance(TICK_INTERVAL_MS);
    expect(tickOf(s.controller)).toBeGreaterThan(0);

    s.controller.reset();
    const state = s.controller.getState();
    expect(state.runState).toBe('idle');
    expect(state.snapshot?.tick).toBe(0);
    expect(state.events).toEqual([]);
    expect(state.seed).toBe(5);
    expect(state.speed).toBe(5);
    expect(s.clock.pendingCount).toBe(0);
    expect(s.engine.loads[s.engine.loads.length - 1].seed).toBe(5);
  });

  it('reset(seed) memakai seed baru', () => {
    const { controller, engine } = setup();
    controller.loadLevel(level1_1, 5);
    controller.reset(42);
    expect(controller.getState().seed).toBe(42);
    expect(engine.loads[engine.loads.length - 1].seed).toBe(42);
  });

  it('reset setelah finished mengizinkan run lagi', () => {
    const s = setup(1);
    s.controller.loadLevel(level1_1);
    s.controller.step();
    expect(s.controller.getState().runState).toBe('finished');
    s.controller.reset();
    s.controller.step();
    expect(s.controller.getState().runState).toBe('finished');
    expect(tickOf(s.controller)).toBe(1);
  });
});

describe('error dari engine', () => {
  it('menghentikan jam, status paused, pesan tersimpan; reset membersihkan', () => {
    const s = setup(100, 2);
    s.controller.loadLevel(level1_1);
    s.controller.setSpeed(5);
    startRunning(s);
    s.clock.advance(TICK_INTERVAL_MS);
    const state = s.controller.getState();
    expect(state.runState).toBe('paused');
    expect(state.error).toBe('UNLOCK oleh non-pemilik');
    expect(s.clock.pendingCount).toBe(0);

    s.controller.reset();
    expect(s.controller.getState().error).toBeNull();
  });
});

describe('subscribe dan getState', () => {
  it('listener dipanggil saat state berubah dan berhenti setelah unsubscribe', () => {
    const { controller } = setup();
    const seen: ControllerState[] = [];
    const unsubscribe = controller.subscribe((s) => seen.push(s));
    controller.loadLevel(level1_1);
    controller.step();
    expect(seen).toHaveLength(2);
    unsubscribe();
    controller.step();
    expect(seen).toHaveLength(2);
  });

  it('getState mengembalikan objek yang sama selama tidak ada perubahan', () => {
    const { controller } = setup();
    controller.loadLevel(level1_1);
    expect(controller.getState()).toBe(controller.getState());
    const before = controller.getState();
    controller.step();
    expect(controller.getState()).not.toBe(before);
  });

  it('pause() dari dalam listener tetap menghentikan loop', () => {
    const s = setup();
    s.controller.loadLevel(level1_1);
    s.controller.subscribe((state) => {
      if (state.runState === 'running') s.controller.pause();
    });
    s.controller.run();
    expect(s.controller.getState().runState).toBe('paused');
    expect(s.clock.pendingCount).toBe(0);
  });
});

describe('dispose', () => {
  it('menghentikan jam dan melepas listener', () => {
    const s = setup();
    let calls = 0;
    s.controller.subscribe(() => (calls += 1));
    s.controller.loadLevel(level1_1);
    s.controller.run();
    const before = calls;
    s.controller.dispose();
    expect(s.clock.pendingCount).toBe(0);
    s.controller.step();
    expect(calls).toBe(before);
  });
});
