import { describe, expect, it } from 'vitest';
import { applyTools } from '../../engine/tools';
import { level2_2 } from '../../levels/module2/level-2-2';
import { buildRwTool, findRwSetup, rwToolId } from '../rwTool';

describe('rwTool', () => {
  const setup = findRwSetup(level2_2);

  it('rentang pembaca dan penulis diturunkan dari program level', () => {
    expect(setup?.readers).toHaveLength(4);
    expect(setup?.readers[0]).toEqual({ thread: 'R1', start: 1, end: 1 });
    expect(setup?.writers).toHaveLength(2);
    expect(setup?.writers[0]).toEqual({ thread: 'W1', start: 1, end: 3 });
  });

  it('alat membawa kebijakan dan id tetap', () => {
    if (setup === null) throw new Error('setup null');
    const tool = buildRwTool(setup, 'fair');
    expect(tool.id).toBe(rwToolId(setup.lockId));
    expect(tool.kind === 'rwlock' && tool.policy).toBe('fair');
  });

  it('applyTools membungkus tiap robot dengan acquire dan release', () => {
    if (setup === null) throw new Error('setup null');
    const threads = applyTools(level2_2.threads, [buildRwTool(setup, 'fair')]);
    const reader = threads.find((t) => t.id === 'R1');
    const writer = threads.find((t) => t.id === 'W1');
    expect(reader?.program.map((i) => i.op)).toEqual([
      'WORK',
      'RW_ACQUIRE_READ',
      'BOARD_READ',
      'RW_RELEASE_READ',
      'WORK',
    ]);
    expect(writer?.program.map((i) => i.op)).toEqual([
      'WORK',
      'RW_ACQUIRE_WRITE',
      'BOARD_WRITE_START',
      'WORK',
      'BOARD_WRITE_END',
      'RW_RELEASE_WRITE',
    ]);
  });

  it('input level tidak termutasi', () => {
    if (setup === null) throw new Error('setup null');
    const before = JSON.stringify(level2_2.threads);
    applyTools(level2_2.threads, [buildRwTool(setup, 'reader')]);
    expect(JSON.stringify(level2_2.threads)).toBe(before);
  });
});