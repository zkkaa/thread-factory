import { Condition } from './primitives/condition';
import { Mutex } from './primitives/mutex';
import { Semaphore } from './primitives/semaphore';
import { createPrng } from './prng';
import { createScheduler, type Scheduler } from './scheduler';
import {
  createThread,
  executeInstruction,
  snapshotThread,
  transition,
  type SyncContext,
  type ThreadRuntime,
} from './thread';
import type {
  EngineConfig,
  SimEvent,
  SimulationEngine,
  Snapshot,
  StepResult,
} from './types';
import { validateConfig } from './validateConfig';

function isRunnable(thread: ThreadRuntime): boolean {
  return thread.state === 'READY' || thread.state === 'RUNNING';
}

/**
 * Mesin simulasi. Tidak punya timer: hanya maju saat step() dipanggil
 * (oleh SimulationController). Semua keacakan berasal dari PRNG berbasis seed,
 * jadi seed yang sama menghasilkan jalannya simulasi yang sama persis.
 *
 * Satu tick:
 *  1. thread WAITING menambah waitTicks; thread NEW dimasukkan ke READY
 *  2. scheduler memilih hingga `cores` thread yang boleh jalan
 *  3. thread RUNNING yang tidak terpilih turun ke READY (context switch)
 *  4. thread terpilih menjadi RUNNING dan mengeksekusi SATU instruksi
 *     (LOCK pada mutex terpakai membuat thread WAITING; UNLOCK membangunkan
 *     thread terdepan di antrean; COND_WAIT/COND_SIGNAL bekerja serupa
 *     lewat antrean condition)
 *  5. simulasi selesai bila semua TERMINATED atau tick mencapai maxTicks
 */
export class Engine implements SimulationEngine {
  private config: EngineConfig | null = null;
  private seed = 0;
  private tick = 0;
  private finished = false;
  private executedInstructions = 0;
  private threads: ThreadRuntime[] = [];
  private threadById = new Map<string, ThreadRuntime>();
  private mutexes = new Map<string, Mutex>();
  private semaphores = new Map<string, Semaphore>();
  private conditions = new Map<string, Condition>();
  private sync: SyncContext | null = null;
  private sharedVars: Record<string, number> = {};
  private scheduler: Scheduler | null = null;
  private areaMembers = new Map<string, Set<string>>();
  private areaCapacities = new Map<string, number>();
  private overloadTickCount = 0;
  private areaOccupancySum = new Map<string, number>();

  get isFinished(): boolean {
    return this.finished;
  }

  load(config: EngineConfig, seed: number): void {
    // Semua pemeriksaan dilakukan dulu agar load() yang gagal tidak merusak state lama.
    validateConfig(config);
    const prng = createPrng(seed); // melempar RangeError bila seed tidak valid
    const scheduler = createScheduler(config.scheduler, prng);

    this.config = config;
    this.seed = seed;
    this.tick = 0;
    this.finished = false;
    this.executedInstructions = 0;
    this.sharedVars = { ...config.sharedVars };
    this.threads = config.threads.map(createThread);
    const threadById = new Map(this.threads.map((t) => [t.def.id, t]));
    this.threadById = threadById;
    this.mutexes = new Map(
      config.mutexes.map((name) => [name, new Mutex(name)]),
    );
    this.semaphores = new Map(
      Object.entries(config.semaphores).map(([name, val]) => [
        name,
        new Semaphore(name, val),
      ]),
    );
    this.conditions = new Map(
      config.conditions.map((name) => [name, new Condition(name)]),
    );
    this.areaCapacities = new Map(Object.entries(config.areas ?? {}));
    this.areaMembers = new Map(
      Array.from(this.areaCapacities.keys(), (area) => [
        area,
        new Set<string>(),
      ]),
    );
    this.overloadTickCount = 0;
    this.areaOccupancySum = new Map(
      Array.from(this.areaCapacities.keys(), (area) => [area, 0]),
    );

    this.sync = {
      mutexes: this.mutexes,
      semaphores: this.semaphores,
      conditions: this.conditions,
      enterArea: (threadId, area) => {
        let members = this.areaMembers.get(area);
        if (!members) {
          members = new Set();
          this.areaMembers.set(area, members);
        }
        members.add(threadId);
      },
      leaveArea: (threadId, area) => {
        this.areaMembers.get(area)?.delete(threadId);
      },
      getThread(id) {
        const thread = threadById.get(id);
        if (thread === undefined) throw new Error(`Thread tidak ada: "${id}"`);
        return thread;
      },
    };
    this.scheduler = scheduler;
  }

  reset(seed?: number): void {
    if (this.config === null) {
      throw new Error('reset() dipanggil sebelum load()');
    }
    this.load(this.config, seed ?? this.seed);
  }

  /**
   * Maju tepat satu tick. Bila simulasi sudah selesai, tidak terjadi apa-apa
   * (tick tidak bertambah dan events kosong), sehingga aman dipanggil berulang.
   */
  step(): StepResult {
    if (this.config === null || this.scheduler === null || this.sync === null) {
      throw new Error('step() dipanggil sebelum load()');
    }
    if (this.finished) {
      return { tick: this.tick, events: [], finished: true };
    }

    this.tick += 1;
    const tick = this.tick;
    const events: SimEvent[] = [];
    const push = (event: SimEvent | null): void => {
      if (event) events.push(event);
    };

    // 1. Waktu tunggu dan admisi thread baru
    for (const thread of this.threads) {
      if (thread.state === 'WAITING') thread.waitTicks += 1;
    }
    for (const thread of this.threads) {
      if (thread.state === 'NEW') push(transition(thread, 'READY', tick));
    }

    // 2. Pemilihan oleh scheduler
    const runnable = this.threads.filter(isRunnable).map((t) => t.def.id);
    if (runnable.length === 0) {
      // Tidak ada thread yang bisa jalan padahal belum semua selesai (semua
      // WAITING, mis. dua thread saling menunggu mutex, atau sinyal condition
      // yang hilang). Berhenti di sini daripada berputar sampai maxTicks.
      // TODO(T-055): pancarkan DEADLOCK_DETECTED sebelum FINISHED.
      this.finished = true;
      events.push({ type: 'FINISHED', tick });
      return { tick, events, finished: true };
    }
    const picked = this.scheduler.pick(runnable);
    const pickedSet = new Set(picked);

    // 3. Thread yang tidak terpilih "dibekukan"
    for (const thread of this.threads) {
      if (thread.state === 'RUNNING' && !pickedSet.has(thread.def.id)) {
        push(transition(thread, 'READY', tick));
      }
    }

    // 4. Thread terpilih mengeksekusi satu instruksi (berurutan dalam satu tick)
    for (const id of picked) {
      const thread = this.threadById.get(id);
      if (thread === undefined) {
        throw new Error(`Scheduler memilih thread yang tidak ada: "${id}"`);
      }
      push(transition(thread, 'RUNNING', tick));
      this.executedInstructions += 1;
      events.push(
        ...executeInstruction(thread, tick, this.sharedVars, this.sync),
      );
      this.assertNoLockLeak(thread);
    }

    // 4b. Pemeriksaan kapasitas area
    let hasOverloadThisTick = false;
    for (const [area, capacity] of this.areaCapacities.entries()) {
      const count = this.areaMembers.get(area)?.size ?? 0;
      this.areaOccupancySum.set(
        area,
        (this.areaOccupancySum.get(area) ?? 0) + count,
      );
      if (count > capacity) {
        hasOverloadThisTick = true;
        events.push({
          type: 'AREA_OVERLOAD',
          tick,
          area,
          count,
          capacity,
        });
      }
    }
    if (hasOverloadThisTick) {
      this.overloadTickCount += 1;
    }

    // 5. Selesai?
    const allTerminated = this.threads.every((t) => t.state === 'TERMINATED');
    if (allTerminated || tick >= this.config.maxTicks) {
      this.finished = true;
      events.push({ type: 'FINISHED', tick });
    }

    return { tick, events, finished: this.finished };
  }

  /**
   * Thread yang selesai tidak boleh masih memegang mutex: itu berarti LOCK dan
   * UNLOCK di programnya tidak seimbang, dan thread lain akan menunggu selamanya.
   */
  private assertNoLockLeak(thread: ThreadRuntime): void {
    if (thread.state !== 'TERMINATED') return;
    for (const mutex of this.mutexes.values()) {
      if (mutex.isOwnedBy(thread.def.id)) {
        throw new Error(
          `Thread "${thread.def.id}" selesai tetapi masih memegang mutex "${mutex.id}" ` +
            `(LOCK dan UNLOCK tidak seimbang)`,
        );
      }
    }
  }

  /** Salinan keadaan penuh; aman dari modifikasi pemanggil. */
  getSnapshot(): Readonly<Snapshot> {
    if (this.config === null) {
      throw new Error('getSnapshot() dipanggil sebelum load()');
    }
    let areaUtilization = 0;
    if (this.areaCapacities.size > 0 && this.tick > 0) {
      let totalRatio = 0;
      for (const [area, capacity] of this.areaCapacities.entries()) {
        const avgCount = (this.areaOccupancySum.get(area) ?? 0) / this.tick;
        const ratio = capacity > 0 ? Math.min(1, avgCount / capacity) : 0;
        totalRatio += ratio;
      }
      areaUtilization = totalRatio / this.areaCapacities.size;
    }

    return {
      tick: this.tick,
      seed: this.seed,
      finished: this.finished,
      threads: this.threads.map(snapshotThread),
      sharedVars: { ...this.sharedVars },
      mutexes: Array.from(this.mutexes.values(), (m) => m.snapshot()),
      semaphores: Array.from(this.semaphores.values(), (s) => s.snapshot()),
      conditions: Array.from(this.conditions.values(), (c) => c.snapshot()),
      areaOccupancy: Object.fromEntries(
        Array.from(this.areaMembers.entries(), ([k, v]) => [k, v.size]),
      ),
      overloadTicks: this.overloadTickCount,
      areaUtilization,
      cores: this.config.scheduler.cores,
      executedInstructions: this.executedInstructions,
      busyWaitTicks: this.threads.reduce((sum, t) => sum + t.waitTicks, 0),
    };
  }
}
