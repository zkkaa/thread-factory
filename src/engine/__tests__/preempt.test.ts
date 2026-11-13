import { describe, expect, it } from 'vitest';
import { Engine } from '../engine';
import type { EngineConfig, Instruction, SimEvent, ThreadDef } from '../types';

function lockPair(first: string, second: string): Instruction[] {
  return [
    { op: 'LOCK', mutex: first },
    { op: 'LOCK', mutex: second },
    { op: 'WORK', ticks: 1 },
    { op: 'UNLOCK', mutex: second },
    { op: 'UNLOCK', mutex: first },
  ];
}

function thread(id: string, program: Instruction[]): ThreadDef {
  return { id, label: id, program, repeat: 1 };
}

function ring(manual: boolean): EngineConfig {
  return {
    threads: [
      thread('A', lockPair('m1', 'm2')),
      thread('B', lockPair('m2', 'm3')),
      thread('C', lockPair('m3', 'm1')),
    ],
    sharedVars: {},
    mutexes: ['m1', 'm2', 'm3'],
    semaphores: {},
    conditions: [],
    scheduler: { kind: 'random', cores: 3 },
    maxTicks: 200,
    ...(manual ? { recovery: 'manual' as const } : {}),
  };
}

function loaded(manual: boolean, seed = 1): Engine {
  const engine = new Engine();
  engine.load(ring(manual), seed);
  return engine;
}

/** Melangkah sampai engine macet (atau selesai). */
function stepUntilStalled(engine: Engine): SimEvent[] {
  const events: SimEvent[] = [];
  for (let i = 0; i < 20 && !engine.isFinished; i += 1) {
    events.push(...engine.step().events);
    if ((engine.getSnapshot().deadlock ?? null) !== null) break;
  }
  return events;
}

/** Menyelesaikan simulasi; tiap kali macet, rampas kunci korban default. */
function finishWithRecovery(engine: Engine, limit = 500): SimEvent[] {
  const events: SimEvent[] = [];
  for (let i = 0; i < limit && !engine.isFinished; i += 1) {
    events.push(...engine.step().events);
    if ((engine.getSnapshot().deadlock ?? null) !== null) {
      events.push(...engine.preempt().events);
    }
  }
  return events;
}

describe('recovery manual: engine macet saat deadlock', () => {
  it('memancarkan DEADLOCK_DETECTED sekali, tanpa FINISHED, dan snapshot memuat siklus', () => {
    const engine = loaded(true);
    const events = stepUntilStalled(engine);

    expect(events.filter((e) => e.type === 'DEADLOCK_DETECTED')).toHaveLength(
      1,
    );
    expect(events.some((e) => e.type === 'FINISHED')).toBe(false);
    expect(engine.isFinished).toBe(false);
    expect(engine.getSnapshot().deadlock).toEqual(['A', 'B', 'C']);
  });

  it('step() saat macet tidak menambah tick dan tidak menghasilkan event', () => {
    const engine = loaded(true);
    stepUntilStalled(engine);
    const tick = engine.getSnapshot().tick;

    const result = engine.step();

    expect(result).toEqual({ tick, events: [], finished: false });
    expect(engine.getSnapshot().tick).toBe(tick);
  });

  it('tanpa recovery, perilaku lama utuh: DEADLOCK_DETECTED lalu FINISHED', () => {
    const engine = loaded(false);
    const events: SimEvent[] = [];
    for (let i = 0; i < 20 && !engine.isFinished; i += 1) {
      events.push(...engine.step().events);
    }

    expect(events.some((e) => e.type === 'DEADLOCK_DETECTED')).toBe(true);
    expect(events.some((e) => e.type === 'FINISHED')).toBe(true);
    expect(engine.getSnapshot().deadlock).toBeNull();
  });

  it('reset() membersihkan keadaan macet dan hitungan perampasan', () => {
    const engine = loaded(true);
    stepUntilStalled(engine);
    engine.preempt();
    engine.reset();

    const snap = engine.getSnapshot();
    expect(snap.deadlock).toBeNull();
    expect(snap.preemptions).toBe(0);
    expect(snap.tick).toBe(0);
  });
});

describe('preempt: merampas kunci dan rollback', () => {
  it('korban default (A): kunci dilepas, diserahkan ke C, A kembali ke awal', () => {
    const engine = loaded(true);
    stepUntilStalled(engine);

    const { events } = engine.preempt();
    const snap = engine.getSnapshot();

    expect(events.map((e) => e.type)).toEqual([
      'THREAD_STATE', // A: WAITING -> READY
      'LOCK_PREEMPTED', // m1 dirampas dari A
      'THREAD_STATE', // C dibangunkan (handoff m1)
      'LOCK_ACQUIRED',
      'THREAD_ROLLED_BACK',
    ]);
    expect(snap.deadlock).toBeNull();
    expect(snap.preemptions).toBe(1);

    const a = snap.threads.find((t) => t.id === 'A');
    expect(a?.state).toBe('READY');
    expect(a?.pc).toBe(0);
    expect(a?.registers).toEqual({});
    expect(a?.waitingOn).toBeNull();

    expect(snap.mutexes.find((m) => m.id === 'm1')?.owner).toBe('C');
    // A keluar dari antrean m2 (yang dipegang B).
    expect(snap.mutexes.find((m) => m.id === 'm2')?.queue).toEqual([]);
    expect(snap.threads.find((t) => t.id === 'C')?.state).toBe('READY');
  });

  it('korban pilihan pemain (B): kuncinya jatuh ke A', () => {
    const engine = loaded(true);
    stepUntilStalled(engine);

    engine.preempt('B');
    const snap = engine.getSnapshot();

    expect(snap.mutexes.find((m) => m.id === 'm2')?.owner).toBe('A');
    expect(snap.threads.find((t) => t.id === 'B')?.pc).toBe(0);
    expect(snap.threads.find((t) => t.id === 'A')?.state).toBe('READY');
  });

  it('setelah pemulihan semua thread selesai dan tidak ada mutex bocor', () => {
    const engine = loaded(true);
    finishWithRecovery(engine);
    const snap = engine.getSnapshot();

    expect(engine.isFinished).toBe(true);
    expect(snap.threads.every((t) => t.state === 'TERMINATED')).toBe(true);
    expect(
      snap.mutexes.every((m) => m.owner === null && m.queue.length === 0),
    ).toBe(true);
    expect(snap.preemptions).toBeGreaterThanOrEqual(1);
    // Tiap perampasan membuat minimal satu thread lain bisa makan: batasnya jumlah makan.
    expect(snap.preemptions).toBeLessThanOrEqual(3);
  });

  it('deterministik: seed sama menghasilkan urutan event yang sama', () => {
    const first = finishWithRecovery(loaded(true, 7));
    const second = finishWithRecovery(loaded(true, 7));
    expect(second).toEqual(first);
  });

  it('melempar error jelas bila tidak ada deadlock', () => {
    const engine = loaded(true);
    expect(() => engine.preempt()).toThrow(/deadlock/);
  });

  it('melempar error bila korban bukan anggota siklus', () => {
    const engine = loaded(true);
    stepUntilStalled(engine);
    expect(() => engine.preempt('Z')).toThrow(/tidak ada di siklus/);
    // Gagal tidak mengubah keadaan: masih macet.
    expect(engine.getSnapshot().deadlock).toEqual(['A', 'B', 'C']);
  });
});
