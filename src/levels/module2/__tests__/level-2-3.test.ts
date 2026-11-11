import { describe, expect, it } from 'vitest';
import { buildEngineConfig } from '../../../controller/buildEngineConfig';
import { Engine } from '../../../engine/engine';
import type { PlacedTool } from '../../../engine/tools';
import { level2_3 } from '../level-2-3';

function seatTool(value: number): PlacedTool {
  return {
    id: 'semaphore:kursi',
    kind: 'semaphore',
    sem: 'kursi',
    value,
    spans: level2_3.threads.map((t) => ({ thread: t.id, start: 0, end: 4 })),
  };
}

/** Jalankan sampai selesai atau macet (deadlock). */
function run(tools: PlacedTool[], seed: number) {
  const engine = new Engine();
  engine.load(buildEngineConfig(level2_3, tools), seed);
  for (let i = 0; i < 1000; i += 1) {
    const snap = engine.getSnapshot();
    if (engine.isFinished || snap.deadlock) break;
    engine.step();
  }
  return engine.getSnapshot();
}

describe('Level 2-3: Meja Teknisi (T-102)', () => {
  it('data level lengkap', () => {
    expect(level2_3.intro.length).toBeGreaterThanOrEqual(2);
    expect(level2_3.intro.length).toBeLessThanOrEqual(3);
    expect(level2_3.hints.length).toBeGreaterThanOrEqual(3);
    expect(level2_3.concepts.length).toBeGreaterThan(0);
    expect(level2_3.explanation?.pass).toBeTruthy();
    expect(level2_3.explanation?.fail).toBeTruthy();
    expect(level2_3.layoutId).toBe('2-3');
    expect(level2_3.recovery).toBe('manual');
    expect(level2_3.threads).toHaveLength(5);
  });

  it('tanpa alat, seed tutorial berujung deadlock', () => {
    const snap = run([], level2_3.tutorialSeed ?? 1);
    expect(Boolean(snap.deadlock)).toBe(true);
    expect(level2_3.goal.invariant(snap).ok).toBe(false);
  });

  it('Kartu Akses bernilai 4 tidak pernah deadlock (banyak seed)', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const snap = run([seatTool(4)], seed);
      expect(Boolean(snap.deadlock), `seed ${seed}`).toBe(false);
      expect(snap.threads.every((t) => t.state === 'TERMINATED')).toBe(true);
      expect(level2_3.goal.invariant(snap).ok).toBe(true);
    }
  });

  it('nilai 5 (tanpa batas efektif) deadlock pada sebagian seed', () => {
    const stuck = Array.from({ length: 50 }, (_, i) => i + 1).filter((seed) =>
      Boolean(run([seatTool(5)], seed).deadlock),
    );
    expect(stuck.length).toBeGreaterThan(0);
  });
});