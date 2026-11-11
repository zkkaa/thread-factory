import { describe, expect, it } from 'vitest';
import { buildEngineConfig } from '../../../controller/buildEngineConfig';
import { Engine } from '../../../engine/engine';
import type { PlacedTool } from '../../../engine/tools';
import { buildRwTool, findRwSetup } from '../../../ui/rwTool';
import type { RwPolicy } from '../../../engine/primitives/rwlock';
import { level2_2 } from '../level-2-2';

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

const SEEDS = Array.from({ length: 50 }, (_, i) => i + 1);

describe('Level 2-2: Papan Pengumuman (T-102 sebelah, Readers-Writers)', () => {
  it('data level lengkap', () => {
    expect(level2_2.intro.length).toBeGreaterThanOrEqual(2);
    expect(level2_2.hints.length).toBeGreaterThanOrEqual(3);
    expect(level2_2.explanation?.pass).toBeTruthy();
    expect(level2_2.layoutId).toBe('2-2');
    expect(level2_2.threads).toHaveLength(6);
    expect(setup).not.toBeNull();
  });

  it('tanpa pengaman, seed tutorial gagal', () => {
    const snap = run([], level2_2.tutorialSeed ?? 1);
    expect(level2_2.goal.invariant(snap).ok).toBe(false);
  });

  it('tanpa pengaman, ada bacaan setengah jadi pada sebagian seed', () => {
    const torn = SEEDS.filter((s) => run([], s).inconsistentReadCount > 0);
    expect(torn.length).toBeGreaterThan(0);
  });

  it('kebijakan fair: lulus pada semua seed', () => {
    for (const seed of SEEDS) {
      const snap = run(tool('fair'), seed);
      expect(level2_2.goal.invariant(snap).ok, `seed ${seed}`).toBe(true);
    }
  });

  it('semua kebijakan tidak pernah membaca data setengah jadi', () => {
    for (const policy of ['reader', 'writer', 'fair'] as const) {
      for (const seed of SEEDS) {
        const snap = run(tool(policy), seed);
        expect(snap.inconsistentReadCount, `${policy} seed ${seed}`).toBe(0);
        expect(snap.writeConflictCount, `${policy} seed ${seed}`).toBe(0);
      }
    }
  });

  it('reader priority membuat penulis kelaparan pada sebagian seed', () => {
    const starved = SEEDS.filter(
      (s) => !level2_2.goal.invariant(run(tool('reader'), s)).ok,
    );
    expect(starved.length).toBeGreaterThan(0);
  });

  it('INFO ukur seed dan ambang (hapus setelah dipakai)', () => {
    const torn = SEEDS.filter((s) => run([], s).inconsistentReadCount > 0);
    console.log('seed bacaan setengah jadi:', torn);
    const seed = torn[0] ?? 1;
    for (const policy of ['reader', 'writer', 'fair'] as const) {
      const snap = run(tool(policy), seed);
      const wait = snap.threads.reduce((sum, t) => sum + t.waitTicks, 0);
      console.log(
        policy,
        'seed',
        seed,
        'tick',
        snap.tick,
        'totalWait',
        wait,
        'peak',
        JSON.stringify(snap.peakWaitStreaks),
      );
    }
  });
});