import { describe, expect, it } from 'vitest';
import { Engine } from '../engine';
import type { RwPolicy } from '../primitives/rwlock';
import { patienceLevel, starvedThreads } from '../starvation';
import type { EngineConfig, Instruction, ThreadDef } from '../types';
import { validateConfig } from '../validateConfig';

function thread(id: string, program: Instruction[]): ThreadDef {
  return { id, label: id, program, repeat: 1 };
}

// R1 memegang kunci baca lama; W menunggu; sama seperti skenario di
// readersWriters.test.ts (W pasti WAITING di sekitar tick 4).
const THREADS: ThreadDef[] = [
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
];

function config(
  starvationTicks?: number,
  policy: RwPolicy = 'fair',
): EngineConfig {
  return {
    threads: THREADS,
    sharedVars: {},
    mutexes: [],
    semaphores: {},
    conditions: [],
    scheduler: { kind: 'random', cores: 2 },
    rwLocks: { papan: policy },
    boards: [],
    starvationTicks,
    maxTicks: 200,
  };
}

/** Menjalankan sampai selesai; mengembalikan riwayat rentetan W tiap tick. */
function run(cfg: EngineConfig, seed = 1) {
  const engine = new Engine();
  engine.load(cfg, seed);
  const history: { state: string; streak: number }[] = [];
  while (!engine.isFinished) {
    engine.step();
    const snap = engine.getSnapshot();
    history.push({
      state: snap.threads.find((t) => t.id === 'W')?.state ?? '',
      streak: snap.waitStreaks?.['W'] ?? -1,
    });
  }
  return { engine, history, snapshot: engine.getSnapshot() };
}

describe('rentetan menunggu (waitStreaks)', () => {
  it('bertambah tepat 1 per tick selama WAITING', () => {
    const { history } = run(config());
    const waiting = history
      .map((h, i) => ({ ...h, i }))
      .filter((h) => h.state === 'WAITING');
    expect(waiting.length).toBeGreaterThanOrEqual(2);
    // Snapshot diambil sesudah tick; W yang baru diblokir pada tick itu belum
    // dihitung (penghitungan terjadi di awal tick berikutnya), jadi cukup
    // memeriksa selisih antar tick WAITING yang berurutan.
    for (let k = 1; k < waiting.length; k += 1) {
      const prev = waiting[k - 1];
      const cur = waiting[k];
      if (prev === undefined || cur === undefined) continue;
      if (cur.i === prev.i + 1) expect(cur.streak).toBe(prev.streak + 1);
    }
  });

  it('kembali ke 0 setelah thread dibangunkan', () => {
    const { snapshot } = run(config());
    expect(snapshot.threads.every((t) => t.state === 'TERMINATED')).toBe(true);
    expect(snapshot.waitStreaks?.['W']).toBe(0);
    expect(snapshot.waitStreaks?.['R1']).toBe(0);
  });

  it('peakWaitStreaks menyimpan rentetan terpanjang dan tidak melebihi waitTicks', () => {
    const { history, snapshot } = run(config());
    const observedMax = Math.max(...history.map((h) => h.streak));
    const peak = snapshot.peakWaitStreaks?.['W'] ?? -1;
    const waitTicks = snapshot.threads.find((t) => t.id === 'W')?.waitTicks;
    expect(peak).toBeGreaterThanOrEqual(observedMax);
    expect(peak).toBeGreaterThan(0);
    expect(peak).toBeLessThanOrEqual(waitTicks ?? -1);
    // W hanya satu kali menunggu, jadi rentetan terpanjang = total menunggu.
    expect(peak).toBe(waitTicks);
  });

  it('thread yang tidak pernah menunggu punya puncak 0', () => {
    const { snapshot } = run(config());
    expect(snapshot.peakWaitStreaks?.['R1']).toBe(0);
  });

  it('seed sama menghasilkan rentetan yang sama persis', () => {
    const a = run(config(), 7).snapshot;
    const b = run(config(), 7).snapshot;
    expect(a.waitStreaks).toEqual(b.waitStreaks);
    expect(a.peakWaitStreaks).toEqual(b.peakWaitStreaks);
  });

  it('load ulang mengosongkan rentetan', () => {
    const { engine } = run(config());
    engine.reset();
    const snap = engine.getSnapshot();
    expect(snap.waitStreaks).toEqual({ R1: 0, W: 0 });
    expect(snap.peakWaitStreaks).toEqual({ R1: 0, W: 0 });
  });

  it('snapshot adalah salinan: mengubahnya tidak memengaruhi engine', () => {
    const { engine } = run(config());
    const snap = engine.getSnapshot();
    if (snap.peakWaitStreaks !== undefined) snap.peakWaitStreaks['W'] = 999;
    expect(engine.getSnapshot().peakWaitStreaks?.['W']).not.toBe(999);
  });
});

describe('starvedThreads', () => {
  it('kosong bila ambang tidak diatur', () => {
    const { snapshot } = run(config(undefined));
    expect(snapshot.starvationTicks).toBeNull();
    expect(starvedThreads(snapshot)).toEqual([]);
  });

  it('mencatat thread yang puncak menunggunya mencapai ambang', () => {
    const peak = run(config()).snapshot.peakWaitStreaks?.['W'] ?? 0;
    const { snapshot } = run(config(peak));
    expect(starvedThreads(snapshot)).toEqual(['W']);
  });

  it('tidak mencatat bila ambang lebih besar dari puncak menunggu', () => {
    const peak = run(config()).snapshot.peakWaitStreaks?.['W'] ?? 0;
    const { snapshot } = run(config(peak + 1));
    expect(starvedThreads(snapshot)).toEqual([]);
  });

  it('tetap tercatat setelah thread dibangunkan dan selesai', () => {
    const { snapshot } = run(config(1));
    expect(snapshot.waitStreaks?.['W']).toBe(0);
    expect(starvedThreads(snapshot)).toEqual(['W']);
  });

  it('kosong untuk snapshot yang belum memuat data rentetan', () => {
    const { snapshot } = run(config(1));
    const lama = {
      ...snapshot,
      waitStreaks: undefined,
      peakWaitStreaks: undefined,
      starvationTicks: undefined,
    };
    expect(starvedThreads(lama)).toEqual([]);
  });
});

describe('patienceLevel', () => {
  it('1 saat tidak menunggu, 0 saat mencapai ambang', () => {
    expect(patienceLevel(0, 10)).toBe(1);
    expect(patienceLevel(10, 10)).toBe(0);
  });

  it('menurun linear di antaranya', () => {
    expect(patienceLevel(5, 10)).toBe(0.5);
    expect(patienceLevel(1, 4)).toBe(0.75);
  });

  it('dibatasi 0..1', () => {
    expect(patienceLevel(99, 10)).toBe(0);
    expect(patienceLevel(-3, 10)).toBe(1);
  });

  it('melempar error bila ambang tidak positif', () => {
    expect(() => patienceLevel(1, 0)).toThrow(/lebih dari 0/);
    expect(() => patienceLevel(1, -2)).toThrow(/lebih dari 0/);
    expect(() => patienceLevel(1, Number.NaN)).toThrow(/lebih dari 0/);
  });
});

describe('validateConfig: starvationTicks', () => {
  it('menerima bilangan bulat >= 1 dan tanpa ambang', () => {
    expect(() => validateConfig(config(1))).not.toThrow();
    expect(() => validateConfig(config(25))).not.toThrow();
    expect(() => validateConfig(config(undefined))).not.toThrow();
  });

  it('menolak 0, negatif, desimal, dan NaN', () => {
    for (const bad of [0, -1, 1.5, Number.NaN]) {
      expect(() => validateConfig(config(bad)), String(bad)).toThrow(
        /starvationTicks harus bilangan bulat >= 1/,
      );
    }
  });
});