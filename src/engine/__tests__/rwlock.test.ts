import { describe, expect, it } from 'vitest';
import { Engine } from '../engine';
import type { RwPolicy } from '../primitives/rwlock';
import {
  applyTools,
  applyToolsDetailed,
  type PlacedRwLockTool,
  type PlacedTool,
} from '../tools';
import type { EngineConfig, Instruction, ThreadDef } from '../types';

const POLICIES: RwPolicy[] = ['reader', 'writer', 'fair'];

// Program ASLI (tanpa pengaman): pembaca langsung membaca papan, penulis
// menulis dua langkah (START, kerja, END).
const READ_PROGRAM: Instruction[] = [
  { op: 'WORK', ticks: 1 },
  { op: 'BOARD_READ', board: 'papan' },
];
const WRITE_PROGRAM: Instruction[] = [
  { op: 'WORK', ticks: 1 },
  { op: 'BOARD_WRITE_START', board: 'papan' },
  { op: 'WORK', ticks: 2 },
  { op: 'BOARD_WRITE_END', board: 'papan' },
];

// Program yang sama bila dijaga kunci baca-tulis (ditulis tangan sebagai pembanding).
const READ_GUARDED: Instruction[] = [
  { op: 'WORK', ticks: 1 },
  { op: 'RW_ACQUIRE_READ', lock: 'papan' },
  { op: 'BOARD_READ', board: 'papan' },
  { op: 'RW_RELEASE_READ', lock: 'papan' },
];
const WRITE_GUARDED: Instruction[] = [
  { op: 'WORK', ticks: 1 },
  { op: 'RW_ACQUIRE_WRITE', lock: 'papan' },
  { op: 'BOARD_WRITE_START', board: 'papan' },
  { op: 'WORK', ticks: 2 },
  { op: 'BOARD_WRITE_END', board: 'papan' },
  { op: 'RW_RELEASE_WRITE', lock: 'papan' },
];

function thread(id: string, program: Instruction[], repeat = 1): ThreadDef {
  return { id, label: id, program: program.map((i) => ({ ...i })), repeat };
}

function threads(): ThreadDef[] {
  return [
    thread('R1', READ_PROGRAM, 3),
    thread('R2', READ_PROGRAM, 3),
    thread('W1', WRITE_PROGRAM, 2),
    thread('W2', WRITE_PROGRAM, 2),
  ];
}

/** Pengaman papan: semua pembaca membungkus BOARD_READ, semua penulis START..END. */
function guard(): PlacedRwLockTool {
  return {
    id: 'rw:papan',
    kind: 'rwlock',
    lock: 'papan',
    readers: [
      { thread: 'R1', start: 1, end: 1 },
      { thread: 'R2', start: 1, end: 1 },
    ],
    writers: [
      { thread: 'W1', start: 1, end: 3 },
      { thread: 'W2', start: 1, end: 3 },
    ],
    spans: [],
  };
}

function config(
  defs: ThreadDef[],
  policy: RwPolicy,
  seedless = true,
): EngineConfig {
  void seedless;
  return {
    threads: defs,
    sharedVars: {},
    mutexes: [],
    semaphores: {},
    conditions: [],
    scheduler: { kind: 'random', cores: 4 },
    rwLocks: { papan: policy },
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

describe('applyTools: alat rwlock', () => {
  it('pembaca: RW_ACQUIRE_READ dan RW_RELEASE_READ membungkus BOARD_READ', () => {
    const out = applyTools(threads(), [guard()]);
    expect(out.find((t) => t.id === 'R1')?.program).toEqual(READ_GUARDED);
    expect(out.find((t) => t.id === 'R2')?.program).toEqual(READ_GUARDED);
  });

  it('penulis: RW_ACQUIRE_WRITE dan RW_RELEASE_WRITE membungkus START sampai END', () => {
    const out = applyTools(threads(), [guard()]);
    expect(out.find((t) => t.id === 'W1')?.program).toEqual(WRITE_GUARDED);
    expect(out.find((t) => t.id === 'W2')?.program).toEqual(WRITE_GUARDED);
  });

  it('thread tanpa rentang tidak berubah', () => {
    const tool: PlacedRwLockTool = {
      ...guard(),
      readers: [{ thread: 'R1', start: 1, end: 1 }],
      writers: [],
    };
    const out = applyTools(threads(), [tool]);
    expect(out.find((t) => t.id === 'R2')?.program).toEqual(READ_PROGRAM);
    expect(out.find((t) => t.id === 'W1')?.program).toEqual(WRITE_PROGRAM);
  });

  it('peta asal: sisipan memakai slot start dan end + 1, instruksi asli tetap tercatat', () => {
    const { origins } = applyToolsDetailed(threads(), [guard()]);
    expect(origins['W1']).toEqual([
      { kind: 'original', index: 0 },
      { kind: 'inserted', op: 'RW_ACQUIRE_WRITE', slot: 1 },
      { kind: 'original', index: 1 },
      { kind: 'original', index: 2 },
      { kind: 'original', index: 3 },
      { kind: 'inserted', op: 'RW_RELEASE_WRITE', slot: 4 },
    ]);
    expect(origins['R1']).toEqual([
      { kind: 'original', index: 0 },
      { kind: 'inserted', op: 'RW_ACQUIRE_READ', slot: 1 },
      { kind: 'original', index: 1 },
      { kind: 'inserted', op: 'RW_RELEASE_READ', slot: 2 },
    ]);
  });

  it('setiap instruksi efektif punya asal (panjang program = panjang asal)', () => {
    const result = applyToolsDetailed(threads(), [guard()]);
    for (const def of result.threads) {
      expect(result.origins[def.id]?.length, def.id).toBe(def.program.length);
    }
  });

  it('input tidak termutasi', () => {
    const input = threads();
    const before = JSON.stringify(input);
    const tool = guard();
    const toolBefore = JSON.stringify(tool);
    applyTools(input, [tool]);
    expect(JSON.stringify(input)).toBe(before);
    expect(JSON.stringify(tool)).toBe(toolBefore);
  });

  it('applyTools sama dengan threads dari applyToolsDetailed', () => {
    expect(applyTools(threads(), [guard()])).toEqual(
      applyToolsDetailed(threads(), [guard()]).threads,
    );
  });

  it('bisa digabung dengan alat lain (mutex) pada thread berbeda', () => {
    const extra: PlacedTool = {
      id: 'mutex:m',
      kind: 'mutex',
      mutex: 'm',
      spans: [{ thread: 'R1', start: 0, end: 0 }],
    };
    const out = applyTools(threads(), [guard(), extra]);
    expect(out.find((t) => t.id === 'R1')?.program.map((i) => i.op)).toEqual([
      'LOCK',
      'WORK',
      'UNLOCK',
      'RW_ACQUIRE_READ',
      'BOARD_READ',
      'RW_RELEASE_READ',
    ]);
  });
});

describe('applyTools: alat rwlock, input tidak valid', () => {
  it('rentang di luar program ditolak', () => {
    const tool: PlacedRwLockTool = {
      ...guard(),
      readers: [{ thread: 'R1', start: 1, end: 5 }],
      writers: [],
    };
    expect(() => applyTools(threads(), [tool])).toThrow(/di luar program/);
  });

  it('thread yang tidak ada ditolak', () => {
    const tool: PlacedRwLockTool = {
      ...guard(),
      readers: [{ thread: 'X', start: 1, end: 1 }],
      writers: [],
    };
    expect(() => applyTools(threads(), [tool])).toThrow(/tidak ada/);
  });

  it('dua rentang tumpang tindih pada kunci yang sama di satu thread ditolak', () => {
    const tool: PlacedRwLockTool = {
      ...guard(),
      readers: [
        { thread: 'R1', start: 0, end: 1 },
        { thread: 'R1', start: 1, end: 1 },
      ],
      writers: [],
    };
    expect(() => applyTools(threads(), [tool])).toThrow(/kunci baca-tulis/);
  });

  it('id alat ganda ditolak', () => {
    expect(() => applyTools(threads(), [guard(), guard()])).toThrow(
      /dipakai lebih dari sekali/,
    );
  });
});

describe('alat rwlock + engine', () => {
  it('tanpa alat, pembaca melihat data setengah jadi pada setiap kebijakan', () => {
    for (const policy of POLICIES) {
      const snap = runToEnd(config(threads(), policy), 1);
      expect(snap.inconsistentReadCount, policy).toBeGreaterThan(0);
    }
  });

  for (const policy of POLICIES) {
    it(`${policy}: dengan alat, tidak ada data setengah jadi, tidak ada bentrok, semua selesai`, () => {
      const guarded = applyTools(threads(), [guard()]);
      for (let seed = 1; seed <= 100; seed += 1) {
        const snap = runToEnd(config(guarded, policy), seed);
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

  it('hasil dengan alat identik dengan program yang dijaga tangan (seed sama)', () => {
    const byTool = applyTools(threads(), [guard()]);
    const byHand: ThreadDef[] = [
      thread('R1', READ_GUARDED, 3),
      thread('R2', READ_GUARDED, 3),
      thread('W1', WRITE_GUARDED, 2),
      thread('W2', WRITE_GUARDED, 2),
    ];
    for (const policy of POLICIES) {
      const a = runToEnd(config(byTool, policy), 7);
      const b = runToEnd(config(byHand, policy), 7);
      expect(a.tick, policy).toBe(b.tick);
      expect(a.threads.map((t) => t.waitTicks), policy).toEqual(
        b.threads.map((t) => t.waitTicks),
      );
    }
  });
});