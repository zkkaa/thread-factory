import { describe, expect, it } from 'vitest';
import { Engine } from '../engine';
import type { RwPolicy } from '../primitives/rwlock';
import { starvedThreads } from '../starvation';
import type { EngineConfig, Instruction, ThreadDef } from '../types';

/**
 * T-054: kebijakan Readers-Writers menentukan apakah writer kelaparan.
 *
 * Memakai jadwal Scripted (bukan acak) supaya hasilnya pasti dan tidak
 * bergantung seed. Skenario: empat reader datang bergantian sehingga selalu
 * ada reader aktif, sementara satu writer menunggu sejak tick 3.
 *  - reader : pembaca baru boleh menyalip penulis yang menunggu, jadi writer
 *             menunggu 18 tick berturut-turut (kelaparan).
 *  - writer : pembaca baru antre di belakang writer; writer cukup 10 tick.
 *  - fair   : satu antrean FIFO; writer juga 10 tick.
 * Ambang starvation 12 berada di antara 10 dan 18.
 */

const STARVATION_TICKS = 12;
const POLICIES: RwPolicy[] = ['reader', 'writer', 'fair'];

// Urutan eksekusi (satu entri = satu jatah, cores = 1).
const SCRIPT = [
  'R1', 'R2', 'W', 'R3', 'R3', 'R1', 'R1', 'R1', 'R4', 'R4',
  'R2', 'R2', 'R2', 'R3', 'R3', 'R3', 'R4', 'R4', 'R4',
];

function reader(id: string): ThreadDef {
  const program: Instruction[] = [
    { op: 'RW_ACQUIRE_READ', lock: 'papan' },
    { op: 'WORK', ticks: 3 },
    { op: 'RW_RELEASE_READ', lock: 'papan' },
  ];
  return { id, label: id, program, repeat: 1 };
}

function writer(): ThreadDef {
  const program: Instruction[] = [
    { op: 'RW_ACQUIRE_WRITE', lock: 'papan' },
    { op: 'WORK', ticks: 1 },
    { op: 'RW_RELEASE_WRITE', lock: 'papan' },
  ];
  return { id: 'W', label: 'W', program, repeat: 1 };
}

function config(policy: RwPolicy, starvationTicks?: number): EngineConfig {
  return {
    threads: [reader('R1'), reader('R2'), reader('R3'), reader('R4'), writer()],
    sharedVars: {},
    mutexes: [],
    semaphores: {},
    conditions: [],
    scheduler: { kind: 'scripted', cores: 1, script: [...SCRIPT] },
    rwLocks: { papan: policy },
    boards: [],
    starvationTicks,
    maxTicks: 300,
  };
}

function run(policy: RwPolicy, seed = 1, starvationTicks = STARVATION_TICKS) {
  const engine = new Engine();
  engine.load(config(policy, starvationTicks), seed);
  while (!engine.isFinished) engine.step();
  return engine.getSnapshot();
}

describe('Readers-Writers: starvation per kebijakan (T-054)', () => {
  it('reader priority: writer kelaparan', () => {
    const snap = run('reader');
    expect(starvedThreads(snap)).toEqual(['W']);
    expect(snap.peakWaitStreaks?.['W']).toBe(18);
    expect(snap.peakWaitStreaks?.['W']).toBeGreaterThanOrEqual(
      STARVATION_TICKS,
    );
  });

  it('reader priority: pembaca sendiri tidak pernah menunggu', () => {
    const snap = run('reader');
    for (const id of ['R1', 'R2', 'R3', 'R4']) {
      expect(snap.peakWaitStreaks?.[id], id).toBe(0);
    }
  });

  for (const policy of ['writer', 'fair'] as const) {
    it(`${policy}: writer tidak kelaparan dan menunggu lebih singkat`, () => {
      const snap = run(policy);
      expect(starvedThreads(snap)).toEqual([]);
      expect(snap.peakWaitStreaks?.['W']).toBe(10);
      expect(snap.peakWaitStreaks?.['W']).toBeLessThan(
        run('reader').peakWaitStreaks?.['W'] ?? 0,
      );
    });
  }

  it('harga kebijakan: reader priority membuat writer menunggu paling lama', () => {
    const wait = (policy: RwPolicy): number =>
      run(policy).threads.find((t) => t.id === 'W')?.waitTicks ?? -1;
    expect(wait('reader')).toBeGreaterThan(wait('writer'));
    expect(wait('reader')).toBeGreaterThan(wait('fair'));
  });

  for (const policy of POLICIES) {
    it(`${policy}: semua thread selesai dan kunci bebas kembali`, () => {
      const snap = run(policy);
      expect(snap.threads.every((t) => t.state === 'TERMINATED')).toBe(true);
      expect(snap.rwLocks[0]?.readers).toEqual([]);
      expect(snap.rwLocks[0]?.writer).toBeNull();
      expect(snap.rwLocks[0]?.queue).toEqual([]);
    });
  }

  it('kebijakan hanya memengaruhi kelaparan, bukan kebenaran data', () => {
    for (const policy of POLICIES) {
      const snap = run(policy);
      expect(snap.inconsistentReadCount, policy).toBe(0);
      expect(snap.writeConflictCount, policy).toBe(0);
    }
  });

  it('tanpa ambang, deteksi mati walau writer menunggu lama', () => {
    const engine = new Engine();
    engine.load(config('reader'), 1);
    while (!engine.isFinished) engine.step();
    const snap = engine.getSnapshot();
    expect(snap.starvationTicks).toBeNull();
    expect(starvedThreads(snap)).toEqual([]);
    // Rentetan tetap dihitung; hanya penilaian kelaparan yang mati.
    expect(snap.peakWaitStreaks?.['W']).toBe(18);
  });

  it('determinisme: seed berbeda, jadwal Scripted sama, hasil identik', () => {
    for (const policy of POLICIES) {
      const a = run(policy, 1);
      const b = run(policy, 999);
      expect(b.peakWaitStreaks, policy).toEqual(a.peakWaitStreaks);
      expect(b.tick, policy).toBe(a.tick);
    }
  });
});