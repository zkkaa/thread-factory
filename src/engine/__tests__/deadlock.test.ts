import { describe, expect, it } from 'vitest';
import { findDeadlockCycle, type DeadlockView } from '../deadlock';
import { Engine } from '../engine';
import type { EngineConfig, Instruction, SimEvent, ThreadDef } from '../types';

function view(
  partial: Partial<DeadlockView> & Pick<DeadlockView, 'threads'>,
): DeadlockView {
  return { mutexes: [], rwLocks: [], ...partial };
}

describe('findDeadlockCycle', () => {
  it('mengembalikan null bila tidak ada yang menunggu', () => {
    expect(
      findDeadlockCycle(
        view({
          threads: [
            { id: 'A', state: 'READY', waitingOn: null },
            { id: 'B', state: 'TERMINATED', waitingOn: null },
          ],
        }),
      ),
    ).toBeNull();
  });

  it('rantai tunggu tanpa kembali bukan siklus', () => {
    expect(
      findDeadlockCycle(
        view({
          threads: [
            { id: 'A', state: 'WAITING', waitingOn: 'mutex:m' },
            { id: 'B', state: 'READY', waitingOn: null },
          ],
          mutexes: [{ id: 'm', owner: 'B' }],
        }),
      ),
    ).toBeNull();
  });

  it('menunggu mutex yang tidak dipegang siapa pun bukan siklus', () => {
    expect(
      findDeadlockCycle(
        view({
          threads: [{ id: 'A', state: 'WAITING', waitingOn: 'mutex:m' }],
          mutexes: [{ id: 'm', owner: null }],
        }),
      ),
    ).toBeNull();
  });

  it('tidur di condition atau semaphore tidak membentuk sisi graf', () => {
    expect(
      findDeadlockCycle(
        view({
          threads: [
            { id: 'A', state: 'WAITING', waitingOn: 'cond:c' },
            { id: 'B', state: 'WAITING', waitingOn: 'sem:s' },
          ],
          mutexes: [{ id: 'm', owner: 'A' }],
        }),
      ),
    ).toBeNull();
  });

  it('dua thread saling menunggu: siklus dimulai dari id terkecil', () => {
    expect(
      findDeadlockCycle(
        view({
          threads: [
            { id: 'B', state: 'WAITING', waitingOn: 'mutex:m1' },
            { id: 'A', state: 'WAITING', waitingOn: 'mutex:m2' },
          ],
          mutexes: [
            { id: 'm1', owner: 'A' },
            { id: 'm2', owner: 'B' },
          ],
        }),
      ),
    ).toEqual(['A', 'B']);
  });

  it('siklus tiga mutex mengikuti arah tunggu dan memutar ke id terkecil', () => {
    expect(
      findDeadlockCycle(
        view({
          threads: [
            { id: 'C', state: 'WAITING', waitingOn: 'mutex:m1' },
            { id: 'B', state: 'WAITING', waitingOn: 'mutex:m3' },
            { id: 'A', state: 'WAITING', waitingOn: 'mutex:m2' },
          ],
          mutexes: [
            { id: 'm1', owner: 'A' },
            { id: 'm2', owner: 'B' },
            { id: 'm3', owner: 'C' },
          ],
        }),
      ),
    ).toEqual(['A', 'B', 'C']);
  });

  it('thread yang menunggu di luar siklus tidak ikut masuk daftar', () => {
    expect(
      findDeadlockCycle(
        view({
          threads: [
            { id: 'D', state: 'WAITING', waitingOn: 'mutex:m3' },
            { id: 'A', state: 'WAITING', waitingOn: 'mutex:m2' },
            { id: 'B', state: 'WAITING', waitingOn: 'mutex:m1' },
          ],
          mutexes: [
            { id: 'm1', owner: 'A' },
            { id: 'm2', owner: 'B' },
            { id: 'm3', owner: 'A' },
          ],
        }),
      ),
    ).toEqual(['A', 'B']);
  });

  it('penulis yang menunggu pembaca, dan pembaca menunggu mutex penulis, adalah siklus', () => {
    expect(
      findDeadlockCycle(
        view({
          threads: [
            { id: 'W', state: 'WAITING', waitingOn: 'rw:papan' },
            { id: 'R1', state: 'WAITING', waitingOn: 'mutex:kunci' },
            { id: 'R2', state: 'READY', waitingOn: null },
          ],
          mutexes: [{ id: 'kunci', owner: 'W' }],
          rwLocks: [{ id: 'papan', readers: ['R2', 'R1'], writer: null }],
        }),
      ),
    ).toEqual(['R1', 'W']);
  });

  it('bila ada dua siklus, tetangga ber-id lebih kecil dipilih lebih dulu', () => {
    expect(
      findDeadlockCycle(
        view({
          threads: [
            { id: 'W', state: 'WAITING', waitingOn: 'rw:papan' },
            { id: 'R2', state: 'WAITING', waitingOn: 'mutex:kunci' },
            { id: 'R1', state: 'WAITING', waitingOn: 'mutex:kunci' },
          ],
          mutexes: [{ id: 'kunci', owner: 'W' }],
          rwLocks: [{ id: 'papan', readers: ['R2', 'R1'], writer: null }],
        }),
      ),
    ).toEqual(['R1', 'W']);
  });
});

function thread(id: string, program: Instruction[]): ThreadDef {
  return { id, label: id, program, repeat: 1 };
}

function run(config: EngineConfig): SimEvent[] {
  const engine = new Engine();
  engine.load(config, 1);
  const events: SimEvent[] = [];
  while (!engine.isFinished) events.push(...engine.step().events);
  return events;
}

describe('Engine memancarkan DEADLOCK_DETECTED', () => {
  it('tiga mutex saling tunggu: satu event siklus, lalu FINISHED pada tick yang sama', () => {
    const lockPair = (first: string, second: string): Instruction[] => [
      { op: 'LOCK', mutex: first },
      { op: 'LOCK', mutex: second },
      { op: 'UNLOCK', mutex: second },
      { op: 'UNLOCK', mutex: first },
    ];
    const events = run({
      threads: [
        thread('A', lockPair('m1', 'm2')),
        thread('B', lockPair('m2', 'm3')),
        thread('C', lockPair('m3', 'm1')),
      ],
      sharedVars: {},
      mutexes: ['m1', 'm2', 'm3'],
      semaphores: {},
      conditions: [],
      scheduler: { kind: 'scripted', cores: 1, script: ['A', 'B', 'C'] },
      maxTicks: 50,
    });

    const deadlock = events.filter(
      (event) => event.type === 'DEADLOCK_DETECTED',
    );
    const finished = events.filter((event) => event.type === 'FINISHED');
    expect(deadlock).toHaveLength(1);
    expect(finished).toHaveLength(1);
    expect(deadlock[0]).toEqual({
      type: 'DEADLOCK_DETECTED',
      tick: finished[0]?.tick,
      cycle: ['A', 'B', 'C'],
    });
    expect(events.indexOf(deadlock[0] as SimEvent)).toBeLessThan(
      events.indexOf(finished[0] as SimEvent),
    );
  });

  it('tidur di condition tanpa sinyal: selesai tanpa DEADLOCK_DETECTED', () => {
    const events = run({
      threads: [
        thread('A', [
          { op: 'LOCK', mutex: 'm' },
          { op: 'COND_WAIT', cond: 'c', mutex: 'm' },
          { op: 'UNLOCK', mutex: 'm' },
        ]),
      ],
      sharedVars: {},
      mutexes: ['m'],
      semaphores: {},
      conditions: ['c'],
      scheduler: { kind: 'scripted', cores: 1, script: ['A', 'A'] },
      maxTicks: 20,
    });

    expect(events.some((event) => event.type === 'DEADLOCK_DETECTED')).toBe(
      false,
    );
    expect(events.some((event) => event.type === 'FINISHED')).toBe(true);
  });
});
