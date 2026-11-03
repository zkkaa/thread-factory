import { describe, it, expect } from 'vitest';
import { Engine } from '../engine';
import { Semaphore } from '../primitives/semaphore';
import type { EngineConfig } from '../types';

describe('Semaphore: primitif', () => {
  it('nilai awal benar dan snapshot sesuai', () => {
    const sem = new Semaphore('token', 3);
    expect(sem.snapshot()).toEqual({
      id: 'token',
      value: 3,
      queue: [],
    });
  });

  it('menolak nilai awal bukan integer atau negatif', () => {
    expect(() => new Semaphore('token', -1)).toThrow(/non-negatif/);
    expect(() => new Semaphore('token', 1.5)).toThrow(/bilangan bulat/);
  });

  it('wait() saat nilai > 0 mengurangi nilai dan mengembalikan true', () => {
    const sem = new Semaphore('token', 2);
    expect(sem.wait('A')).toBe(true);
    expect(sem.snapshot()).toEqual({
      id: 'token',
      value: 1,
      queue: [],
    });
    expect(sem.wait('B')).toBe(true);
    expect(sem.snapshot()).toEqual({
      id: 'token',
      value: 0,
      queue: [],
    });
  });

  it('wait() saat nilai <= 0 memasukkan thread ke antrean dan mengembalikan false', () => {
    const sem = new Semaphore('token', 1);
    expect(sem.wait('A')).toBe(true);
    expect(sem.wait('B')).toBe(false);
    expect(sem.snapshot()).toEqual({
      id: 'token',
      value: -1,
      queue: ['B'],
    });
    expect(sem.wait('C')).toBe(false);
    expect(sem.snapshot()).toEqual({
      id: 'token',
      value: -2,
      queue: ['B', 'C'],
    });
  });

  it('signal() menambah nilai dan membangunkan thread secara FIFO', () => {
    const sem = new Semaphore('token', 0);
    sem.wait('A');
    sem.wait('B');
    sem.wait('C');
    expect(sem.snapshot().queue).toEqual(['A', 'B', 'C']);

    expect(sem.signal()).toBe('A');
    expect(sem.snapshot().queue).toEqual(['B', 'C']);

    expect(sem.signal()).toBe('B');
    expect(sem.snapshot().queue).toEqual(['C']);

    expect(sem.signal()).toBe('C');
    expect(sem.snapshot().queue).toEqual([]);

    // Signal saat queue kosong
    expect(sem.signal()).toBeNull();
    expect(sem.snapshot().value).toBe(1);
  });

  it('melempar error jika thread yang sama memanggil wait saat sudah mengantre', () => {
    const sem = new Semaphore('token', 0);
    sem.wait('A');
    expect(() => sem.wait('A')).toThrow(/sudah mengantre/);
  });
});

describe('Semaphore: Integrasi Engine (SEM_WAIT dan SEM_SIGNAL)', () => {
  const makeSemaphoreConfig = (script?: string[]): EngineConfig => ({
    threads: [
      {
        id: 'A',
        label: 'Robot A',
        program: [
          { op: 'SEM_WAIT', sem: 's' },
          { op: 'WORK', ticks: 2 },
          { op: 'SEM_SIGNAL', sem: 's' },
        ],
      },
      {
        id: 'B',
        label: 'Robot B',
        program: [
          { op: 'SEM_WAIT', sem: 's' },
          { op: 'WORK', ticks: 2 },
          { op: 'SEM_SIGNAL', sem: 's' },
        ],
      },
      {
        id: 'C',
        label: 'Robot C',
        program: [
          { op: 'SEM_WAIT', sem: 's' },
          { op: 'WORK', ticks: 2 },
          { op: 'SEM_SIGNAL', sem: 's' },
        ],
      },
      {
        id: 'D',
        label: 'Robot D',
        program: [
          { op: 'SEM_WAIT', sem: 's' },
          { op: 'WORK', ticks: 2 },
          { op: 'SEM_SIGNAL', sem: 's' },
        ],
      },
    ],
    sharedVars: {},
    mutexes: [],
    semaphores: { s: 2 },
    conditions: [],
    scheduler: script
      ? { kind: 'scripted', cores: 1, script }
      : { kind: 'random', cores: 4 },
    maxTicks: 100,
  });

  it('4 thread berebut semaphore kapasitas 2: 2 jalan, 2 diblokir di antrean FIFO', () => {
    // Scripted: A minta, B minta, C minta, D minta
    const engine = new Engine();
    engine.load(
      makeSemaphoreConfig(['A', 'B', 'C', 'D', 'A', 'A', 'B', 'B']),
      1,
    );

    // Tick 0: NEW -> READY
    // Tick 1: A menjalankan SEM_WAIT (dapat token, pc maju ke WORK)
    engine.step();
    let snap = engine.getSnapshot();
    expect(snap.semaphores[0].value).toBe(1);
    expect(snap.threads.find((t) => t.id === 'A')?.state).toBe('RUNNING');

    // Tick 2: B menjalankan SEM_WAIT (dapat token, pc maju ke WORK)
    engine.step();
    snap = engine.getSnapshot();
    expect(snap.semaphores[0].value).toBe(0);
    expect(snap.threads.find((t) => t.id === 'B')?.state).toBe('RUNNING');

    // Tick 3: C menjalankan SEM_WAIT (token habis, C jadi WAITING)
    const step3 = engine.step();
    snap = engine.getSnapshot();
    expect(snap.semaphores[0].value).toBe(-1);
    expect(snap.semaphores[0].queue).toEqual(['C']);
    const threadC = snap.threads.find((t) => t.id === 'C');
    expect(threadC?.state).toBe('WAITING');
    expect(threadC?.waitingOn).toBe('sem:s');
    expect(
      step3.events.some((e) => e.type === 'BLOCKED' && e.thread === 'C'),
    ).toBe(true);

    // Tick 4: D menjalankan SEM_WAIT (token habis, D jadi WAITING)
    engine.step();
    snap = engine.getSnapshot();
    expect(snap.semaphores[0].value).toBe(-2);
    expect(snap.semaphores[0].queue).toEqual(['C', 'D']);
    expect(snap.threads.find((t) => t.id === 'D')?.state).toBe('WAITING');

    // Tick 5: A WORK (sisa 1)
    engine.step();
    // Tick 6: A WORK selesai
    engine.step();

    // Sekarang A ada di SEM_SIGNAL
    // Scripted lanjutan: A memanggil SEM_SIGNAL
    engine.load(
      makeSemaphoreConfig([
        'A',
        'B',
        'C',
        'D',
        'A',
        'A',
        'A', // SEM_SIGNAL oleh A
      ]),
      1,
    );
    for (let i = 0; i < 6; i++) engine.step();

    // Tick 7: A melakukan SEM_SIGNAL
    const stepSignal = engine.step();
    snap = engine.getSnapshot();
    // C dibangunkan ke READY, pc C maju
    expect(snap.semaphores[0].queue).toEqual(['D']);
    const threadCAfter = snap.threads.find((t) => t.id === 'C');
    expect(threadCAfter?.state).toBe('READY');
    expect(threadCAfter?.pc).toBe(1); // pc maju melewati SEM_WAIT
    expect(
      stepSignal.events.some(
        (e) =>
          e.type === 'THREAD_STATE' && e.thread === 'C' && e.to === 'READY',
      ),
    ).toBe(true);
  });

  it('semua 4 thread selesai jika dijalankan dengan scheduler acak', () => {
    const engine = new Engine();
    engine.load(makeSemaphoreConfig(), 42);

    while (!engine.isFinished) {
      engine.step();
    }

    const snap = engine.getSnapshot();
    expect(snap.threads.every((t) => t.state === 'TERMINATED')).toBe(true);
    expect(snap.semaphores[0].value).toBe(2);
    expect(snap.semaphores[0].queue).toEqual([]);
  });
});
