import { describe, expect, it } from 'vitest';
import { Engine } from '../engine';
import type { RwPolicy } from '../primitives/rwlock';
import type { EngineConfig, Instruction, ThreadDef } from '../types';

const POLICIES: RwPolicy[] = ['reader', 'writer', 'fair'];

function thread(id: string, program: Instruction[], repeat = 1): ThreadDef {
  return { id, label: id, program, repeat };
}

function config(
  threads: ThreadDef[],
  cores: number,
  policy?: RwPolicy,
): EngineConfig {
  return {
    threads,
    sharedVars: {},
    mutexes: [],
    semaphores: {},
    conditions: [],
    scheduler: { kind: 'random', cores },
    rwLocks: policy === undefined ? {} : { papan: policy },
    boards: ['papan'],
    maxTicks: 500,
  };
}

function runToEnd(cfg: EngineConfig, seed: number) {
  const engine = new Engine();
  engine.load(cfg, seed);
  while (!engine.isFinished) engine.step();
  return engine.getSnapshot();
}

const READER_OPEN: Instruction[] = [
  { op: 'WORK', ticks: 1 },
  { op: 'BOARD_READ', board: 'papan' },
];
const WRITER_OPEN: Instruction[] = [
  { op: 'WORK', ticks: 1 },
  { op: 'BOARD_WRITE_START', board: 'papan' },
  { op: 'WORK', ticks: 2 },
  { op: 'BOARD_WRITE_END', board: 'papan' },
];
const READER_GUARDED: Instruction[] = [
  { op: 'WORK', ticks: 1 },
  { op: 'RW_ACQUIRE_READ', lock: 'papan' },
  { op: 'BOARD_READ', board: 'papan' },
  { op: 'RW_RELEASE_READ', lock: 'papan' },
];
const WRITER_GUARDED: Instruction[] = [
  { op: 'WORK', ticks: 1 },
  { op: 'RW_ACQUIRE_WRITE', lock: 'papan' },
  { op: 'BOARD_WRITE_START', board: 'papan' },
  { op: 'WORK', ticks: 2 },
  { op: 'BOARD_WRITE_END', board: 'papan' },
  { op: 'RW_RELEASE_WRITE', lock: 'papan' },
];

describe('Papan tanpa pengaman', () => {
  it('pembaca yang membaca saat penulis menulis mendapat data setengah jadi', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const snap = runToEnd(
        config(
          [
            thread('R1', READER_OPEN, 3),
            thread('R2', READER_OPEN, 3),
            thread('W1', WRITER_OPEN),
          ],
          3,
        ),
        seed,
      );
      // Pada tick 4 penulis masih menulis dan kedua pembaca membaca.
      expect(snap.inconsistentReadCount, `seed ${seed}`).toBeGreaterThanOrEqual(
        2,
      );
      expect(snap.boards[0]?.inconsistentReads).toBe(
        snap.inconsistentReadCount,
      );
    }
  });

  it('dua penulis menulis bersamaan menimbulkan bentrok', () => {
    const snap = runToEnd(
      config([thread('W1', WRITER_OPEN), thread('W2', WRITER_OPEN)], 2),
      1,
    );
    expect(snap.writeConflictCount).toBeGreaterThanOrEqual(1);
  });

  it('BOARD_WRITE_END tanpa START melempar error jelas', () => {
    const engine = new Engine();
    engine.load(
      config([thread('W1', [{ op: 'BOARD_WRITE_END', board: 'papan' }])], 1),
      1,
    );
    expect(() => engine.step()).toThrow(/tanpa BOARD_WRITE_START/);
  });
});

describe('Papan dengan RwLock', () => {
  for (const policy of POLICIES) {
    it(`${policy}: tidak ada data setengah jadi, tidak ada bentrok, semua selesai`, () => {
      for (let seed = 1; seed <= 100; seed += 1) {
        const snap = runToEnd(
          config(
            [
              thread('R1', READER_GUARDED, 3),
              thread('R2', READER_GUARDED, 3),
              thread('W1', WRITER_GUARDED, 2),
              thread('W2', WRITER_GUARDED, 2),
            ],
            4,
            policy,
          ),
          seed,
        );
        const label = `${policy} seed ${seed}`;
        expect(snap.inconsistentReadCount, label).toBe(0);
        expect(snap.writeConflictCount, label).toBe(0);
        expect(
          snap.threads.every((t) => t.state === 'TERMINATED'),
          label,
        ).toBe(true);
        expect(snap.rwLocks[0]?.readers, label).toEqual([]);
        expect(snap.rwLocks[0]?.writer, label).toBeNull();
      }
    });
  }
});

describe('Kebijakan menentukan nasib pembaca baru (tick 4)', () => {
  // R1 memegang kunci baca lama; W menunggu sejak tick 2; R2 meminta di tick 4.
  const threads = (): ThreadDef[] => [
    thread('R1', [
      { op: 'RW_ACQUIRE_READ', lock: 'papan' },
      { op: 'WORK', ticks: 6 },
      { op: 'RW_RELEASE_READ', lock: 'papan' },
    ]),
    thread('W', [
      { op: 'WORK', ticks: 1 },
      { op: 'RW_ACQUIRE_WRITE', lock: 'papan' },
      { op: 'RW_RELEASE_WRITE', lock: 'papan' },
    ]),
    thread('R2', [
      { op: 'WORK', ticks: 3 },
      { op: 'RW_ACQUIRE_READ', lock: 'papan' },
      { op: 'RW_RELEASE_READ', lock: 'papan' },
    ]),
  ];

  function snapshotAtTick4(policy: RwPolicy) {
    const engine = new Engine();
    engine.load(config(threads(), 3, policy), 1);
    for (let i = 0; i < 4; i += 1) engine.step();
    return engine.getSnapshot();
  }

  it('penulis memang menunggu pembaca (WAITING pada rw:papan)', () => {
    const snap = snapshotAtTick4('fair');
    const writer = snap.threads.find((t) => t.id === 'W');
    expect(writer?.state).toBe('WAITING');
    expect(writer?.waitingOn).toBe('rw:papan');
  });

  it('reader priority: pembaca baru langsung masuk walau penulis menunggu', () => {
    const snap = snapshotAtTick4('reader');
    expect(snap.threads.find((t) => t.id === 'R2')?.state).not.toBe('WAITING');
    expect(snap.rwLocks[0]?.readers).toContain('R2');
  });

  for (const policy of ['writer', 'fair'] as const) {
    it(`${policy}: pembaca baru antre di belakang penulis`, () => {
      const snap = snapshotAtTick4(policy);
      expect(snap.threads.find((t) => t.id === 'R2')?.state).toBe('WAITING');
      expect(snap.rwLocks[0]?.queue.map((w) => w.thread)).toEqual(['W', 'R2']);
    });
  }
});
