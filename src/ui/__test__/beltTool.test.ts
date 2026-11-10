import { describe, expect, it } from 'vitest';
import { buildEngineConfig } from '../../controller/buildEngineConfig';
import { evaluateLevel } from '../../controller/evaluateLevel';
import { Engine } from '../../engine/engine';
import { applyTools, type PlacedTool } from '../../engine/tools';
import type { EngineConfig } from '../../engine/types';
import { level2_1 } from '../../levels/module2/level-2-1';
import {
  beltToolId,
  buildBeltTool,
  findBeltSetup,
  isBeltGuardPlaced,
} from '../beltTool';

function run(config: EngineConfig, seed: number) {
  const engine = new Engine();
  engine.load(config, seed);
  while (!engine.isFinished) engine.step();
  return engine.getSnapshot();
}

function passes(tools: PlacedTool[], seed: number): boolean {
  const snap = run(buildEngineConfig(level2_1, tools), seed);
  return evaluateLevel(level2_1, snap).ok;
}

describe('beltTool (Level 2-1)', () => {
  const setup = findBeltSetup(level2_1);

  it('membaca perakit (PUT_ITEM) dan pengepak (TAKE_ITEM) dari data level', () => {
    expect(setup).not.toBeNull();
    expect(setup?.producers).toEqual([
      { thread: 'P1', index: 1 },
      { thread: 'P2', index: 1 },
    ]);
    expect(setup?.consumers).toEqual([
      { thread: 'C1', index: 0 },
      { thread: 'C2', index: 0 },
    ]);
  });

  it('null bila level tidak menyediakan semaphorePair', () => {
    expect(findBeltSetup({ ...level2_1, availableTools: [] })).toBeNull();
  });

  it('Penjaga Slot: tunggu empty, sinyal full, di semua perakit', () => {
    if (setup === null) throw new Error('setup kosong');
    const tool = buildBeltTool(setup, 'slot');
    expect(tool).toMatchObject({
      id: 'belt:slot',
      kind: 'semaphorePair',
      waitSem: 'empty',
      signalSem: 'full',
    });
    expect(tool.spans).toEqual([
      { thread: 'P1', start: 1, end: 1 },
      { thread: 'P2', start: 1, end: 1 },
    ]);
  });

  it('Penjaga Barang: tunggu full, sinyal empty, di semua pengepak', () => {
    if (setup === null) throw new Error('setup kosong');
    const tool = buildBeltTool(setup, 'item');
    expect(tool).toMatchObject({ waitSem: 'full', signalSem: 'empty' });
    expect(tool.spans.map((s) => s.thread)).toEqual(['C1', 'C2']);
  });

  it('applyTools menghasilkan program yang benar untuk kedua penjaga', () => {
    if (setup === null) throw new Error('setup kosong');
    const threads = applyTools(level2_1.threads, [
      buildBeltTool(setup, 'slot'),
      buildBeltTool(setup, 'item'),
    ]);
    expect(threads[0]?.program).toEqual([
      { op: 'WORK', ticks: 1 },
      { op: 'SEM_WAIT', sem: 'empty' },
      { op: 'PUT_ITEM', buffer: 'ban' },
      { op: 'SEM_SIGNAL', sem: 'full' },
    ]);
    expect(threads[2]?.program).toEqual([
      { op: 'SEM_WAIT', sem: 'full' },
      { op: 'TAKE_ITEM', buffer: 'ban' },
      { op: 'SEM_SIGNAL', sem: 'empty' },
      { op: 'WORK', ticks: 1 },
    ]);
  });

  it('isBeltGuardPlaced membaca alat terpasang berdasarkan id', () => {
    if (setup === null) throw new Error('setup kosong');
    const tools = [buildBeltTool(setup, 'slot')];
    expect(isBeltGuardPlaced(tools, 'slot')).toBe(true);
    expect(isBeltGuardPlaced(tools, 'item')).toBe(false);
    expect(beltToolId('item')).toBe('belt:item');
  });

  it('kedua penjaga terpasang: lulus pada 200 seed', () => {
    if (setup === null) throw new Error('setup kosong');
    const tools = [buildBeltTool(setup, 'slot'), buildBeltTool(setup, 'item')];
    for (let seed = 1; seed <= 200; seed += 1) {
      expect(passes(tools, seed), `seed ${seed}`).toBe(true);
    }
  });

  it('seed tutorial 10 dengan kedua penjaga: lulus dengan 3 bintang', () => {
    if (setup === null) throw new Error('setup kosong');
    const tools = [buildBeltTool(setup, 'slot'), buildBeltTool(setup, 'item')];
    const snap = run(buildEngineConfig(level2_1, tools), 10);
    const result = evaluateLevel(level2_1, snap);
    expect(result.ok).toBe(true);
    expect(result.stars).toBe(3);
  });

  it('hanya satu penjaga: level tetap gagal', () => {
    if (setup === null) throw new Error('setup kosong');
    for (const guard of ['slot', 'item'] as const) {
      const tools = [buildBeltTool(setup, guard)];
      for (let seed = 1; seed <= 50; seed += 1) {
        expect(passes(tools, seed), `${guard} seed ${seed}`).toBe(false);
      }
    }
  });
});
