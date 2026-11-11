import { describe, expect, it } from 'vitest';
import { buildEngineConfig } from '../../../controller/buildEngineConfig';
import { evaluateLevel } from '../../../controller/evaluateLevel';
import { Engine } from '../../../engine/engine';
import type { PlacedTool } from '../../../engine/tools';
import type { RwPolicy } from '../../../engine/primitives/rwlock';
import { buildRwTool, findRwSetup } from '../../../ui/rwTool';
import {
  level2_2,
  LEVEL_2_2_LOCK,
  LEVEL_2_2_READERS,
  LEVEL_2_2_WRITERS,
} from '../level-2-2';

const setup = findRwSetup(level2_2);

function tool(policy: RwPolicy): PlacedTool[] {
  if (setup === null) throw new Error('setup null');
  return [buildRwTool(setup, policy)];
}

function run(tools: PlacedTool[], seed: number) {
  const engine = new Engine();
  engine.load(buildEngineConfig(level2_2, tools), seed);
  for (let i = 0; i < 3000 && !engine.isFinished; i += 1) engine.step();
  return engine.getSnapshot();
}

type Snap = ReturnType<typeof run>;

const SEEDS = Array.from({ length: 50 }, (_, i) => i + 1);
const POLICIES = ['reader', 'writer', 'fair'] as const;

const allDone = (snap: Snap): boolean =>
  snap.threads.every((t) => t.state === 'TERMINATED');

/** Puncak tunggu berturut-turut terbesar milik penulis (id berawalan W). */
function writerPeak(snap: Snap): number {
  return Math.max(
    0,
    ...Object.entries(snap.peakWaitStreaks ?? {})
      .filter(([id]) => id.startsWith('W'))
      .map(([, value]) => value),
  );
}

/** Puncak penulis terbesar pada semua seed untuk satu kebijakan. */
function worstWriterPeak(policy: RwPolicy): number {
  return Math.max(...SEEDS.map((seed) => writerPeak(run(tool(policy), seed))));
}

describe('Level 2-2: Papan Pengumuman (Readers-Writers)', () => {
  it('data level lengkap', () => {
    expect(level2_2.intro.length).toBeGreaterThanOrEqual(2);
    expect(level2_2.hints.length).toBeGreaterThanOrEqual(3);
    expect(level2_2.explanation?.pass).toBeTruthy();
    expect(level2_2.layoutId).toBe('2-2');
    expect(level2_2.threads).toHaveLength(
      LEVEL_2_2_READERS + LEVEL_2_2_WRITERS,
    );
    expect(setup).not.toBeNull();
  });

  it('alat kebijakan benar-benar memasang kebijakan pada kunci', () => {
    for (const policy of POLICIES) {
      const config = buildEngineConfig(level2_2, tool(policy));
      expect(config.rwLocks?.[LEVEL_2_2_LOCK], `kebijakan ${policy}`).toBe(
        policy,
      );
    }
  });

  it('tanpa pengaman, seed tutorial gagal', () => {
    const snap = run([], level2_2.tutorialSeed ?? 1);
    expect(level2_2.goal.invariant(snap).ok).toBe(false);
  });

  it('tanpa pengaman, seed tutorial menghasilkan bacaan setengah jadi', () => {
    const snap = run([], level2_2.tutorialSeed ?? 1);
    expect(snap.inconsistentReadCount).toBeGreaterThan(0);
  });

  it('tanpa pengaman, ada bacaan setengah jadi pada sebagian seed', () => {
    const torn = SEEDS.filter((s) => run([], s).inconsistentReadCount > 0);
    expect(torn.length).toBeGreaterThan(0);
  });

  it('semua kebijakan: semua robot selesai pada semua seed', () => {
    for (const policy of POLICIES) {
      for (const seed of SEEDS) {
        expect(allDone(run(tool(policy), seed)), `${policy} seed ${seed}`).toBe(
          true,
        );
      }
    }
  });

  it('semua kebijakan tidak pernah membaca data setengah jadi', () => {
    for (const policy of POLICIES) {
      for (const seed of SEEDS) {
        const snap = run(tool(policy), seed);
        expect(snap.inconsistentReadCount, `${policy} seed ${seed}`).toBe(0);
        expect(snap.writeConflictCount, `${policy} seed ${seed}`).toBe(0);
      }
    }
  });

  it('kebijakan fair: lulus pada semua seed', () => {
    for (const seed of SEEDS) {
      const verdict = level2_2.goal.invariant(run(tool('fair'), seed));
      expect(verdict.ok, `seed ${seed}: ${verdict.message}`).toBe(true);
    }
  });

  it('kebijakan writer priority: lulus pada semua seed', () => {
    for (const seed of SEEDS) {
      const verdict = level2_2.goal.invariant(run(tool('writer'), seed));
      expect(verdict.ok, `seed ${seed}: ${verdict.message}`).toBe(true);
    }
  });

  it('reader priority membuat penulis kelaparan pada sebagian seed', () => {
    const starved = SEEDS.filter(
      (s) => !level2_2.goal.invariant(run(tool('reader'), s)).ok,
    );
    expect(
      starved.length,
      `ambang ${level2_2.starvationTicks}, puncak penulis terburuk reader = ${worstWriterPeak('reader')}`,
    ).toBeGreaterThan(0);
  });

  it('syarat pemisah: puncak penulis fair lebih kecil daripada reader priority', () => {
    const fair = worstWriterPeak('fair');
    const reader = worstWriterPeak('reader');
    expect(fair, `fair ${fair}, reader ${reader}`).toBeLessThan(reader);
  });

  it('ambang starvation berada di antara puncak fair dan puncak reader', () => {
    const limit = level2_2.starvationTicks ?? 0;
    const fair = worstWriterPeak('fair');
    const reader = worstWriterPeak('reader');
    expect(limit, `fair ${fair}, reader ${reader}`).toBeGreaterThan(fair);
    expect(limit, `fair ${fair}, reader ${reader}`).toBeLessThanOrEqual(
      reader,
    );
  });

  // baru: pemain pertama kali mencoba memakai seed tutorial, jadi kelaparan
  // pada reader priority harus terlihat di seed itu.
  it('seed tutorial: reader priority membuat penulis kelaparan', () => {
    const seed = level2_2.tutorialSeed ?? 1;
    const verdict = level2_2.goal.invariant(run(tool('reader'), seed));
    expect(verdict.ok, `seed ${seed}: ${verdict.message}`).toBe(false);
  });

  // baru: jawaban benar (fair) pada seed tutorial harus mendapat 3 bintang.
  it('seed tutorial: kebijakan fair mendapat 3 bintang', () => {
    const seed = level2_2.tutorialSeed ?? 1;
    const result = evaluateLevel(level2_2, run(tool('fair'), seed));
    expect(result.ok, result.message).toBe(true);
    expect(result.stars).toBe(3);
  });
});