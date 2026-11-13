import { describe, expect, it } from 'vitest';
import { buildEngineConfig } from '../../../controller/buildEngineConfig';
import { evaluateLevel } from '../../../controller/evaluateLevel';
import { Engine } from '../../../engine/engine';
import type { RwPolicy } from '../../../engine/primitives/rwlock';
import type { PlacedTool } from '../../../engine/tools';
import { buildBeltTool, findBeltSetup } from '../../../ui/beltTool';
import { buildRwTool, findRwSetup } from '../../../ui/rwTool';
import { LEVEL_2_3_THREADS } from '../level-2-3.scenario';
import { level2_4 } from '../level-2-4';

const SEED = level2_4.tutorialSeed as number;

function beltTools(): PlacedTool[] {
  const setup = findBeltSetup(level2_4);
  if (setup === null) throw new Error('setup ban tidak ditemukan');
  return [buildBeltTool(setup, 'slot'), buildBeltTool(setup, 'item')];
}

function rwTool(policy: RwPolicy): PlacedTool {
  const setup = findRwSetup(level2_4);
  if (setup === null) throw new Error('setup papan tidak ditemukan');
  return buildRwTool(setup, policy);
}

function seatTool(value: number): PlacedTool {
  return {
    id: 'semaphore:kursi',
    kind: 'semaphore',
    sem: 'kursi',
    value,
    spans: LEVEL_2_3_THREADS.map((t) => ({ thread: t.id, start: 0, end: 4 })),
  };
}

function play(tools: PlacedTool[], seed: number) {
  const engine = new Engine();
  engine.load(buildEngineConfig(level2_4, tools), seed);
  for (let i = 0; i < 3000; i += 1) {
    if (engine.isFinished || engine.getSnapshot().deadlock) break;
    engine.step();
  }
  const snapshot = engine.getSnapshot();
  return { snapshot, result: evaluateLevel(level2_4, snapshot) };
}

describe('Level 2-4: perilaku dan bintang (T-104)', () => {
  it('tanpa alat: deadlock, gagal, 0 bintang', () => {
    const { snapshot, result } = play([], SEED);
    expect(Boolean(snapshot.deadlock)).toBe(true);
    expect(result.ok).toBe(false);
    expect(result.stars).toBe(0);
  });

  it('kombinasi lengkap memakai tepat seluruh anggaran koin', () => {
    const full = [...beltTools(), rwTool('fair'), seatTool(4)];
    expect(full).toHaveLength(level2_4.toolBudget as number);
  });

  it('kebijakan reader: penulis kelaparan, gagal', () => {
    const { result } = play(
      [...beltTools(), rwTool('reader'), seatTool(4)],
      SEED,
    );
    expect(result.ok).toBe(false);
    expect(result.message).toContain('kelaparan');
  });

  it('fair atau writer dengan kursi 4: lulus, 2 bintang', () => {
    for (const policy of ['fair', 'writer'] as const) {
      const { result } = play(
        [...beltTools(), rwTool(policy), seatTool(4)],
        SEED,
      );
      expect(result.ok, policy).toBe(true);
      expect(result.stars, policy).toBe(2);
    }
  });

  it('fair dengan kursi 3: lulus, 3 bintang', () => {
    const { result } = play(
      [...beltTools(), rwTool('fair'), seatTool(3)],
      SEED,
    );
    expect(result.ok).toBe(true);
    expect(result.stars).toBe(3);
  });

  it('melepas satu area membuat level gagal', () => {
    const noBelt = play([rwTool('fair'), seatTool(4)], SEED).result;
    const noBoard = play([...beltTools(), seatTool(4)], SEED).result;
    const noSeat = play([...beltTools(), rwTool('fair')], SEED).result;
    expect(noBelt.ok).toBe(false);
    expect(noBoard.ok).toBe(false);
    expect(noSeat.ok).toBe(false);
  });

  it('seed lain: tetap dinilai, bintang null', () => {
    const tools = [...beltTools(), rwTool('fair'), seatTool(3)];
    expect(play(tools, SEED + 1).result.stars).toBeNull();
  });
});
