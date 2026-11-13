import { describe, expect, it } from 'vitest';
import { level2_4 } from '../../levels/module2/level-2-4';
import { getLayout } from '../layouts';

describe('layout Level 2-4 (T-103)', () => {
  const layout = getLayout('2-4');

  it('terdaftar sebagai layout triple', () => {
    expect(layout?.kind).toBe('triple');
  });

  it('id thread ketiga arena membagi habis thread level, tanpa tumpang tindih', () => {
    if (layout?.kind !== 'triple') throw new Error('bukan layout triple');
    const ids = [
      ...layout.belt.producerIds,
      ...layout.belt.consumerIds,
      ...layout.board.readerIds,
      ...layout.board.writerIds,
      ...layout.table.seatIds,
    ];
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(level2_4.threads.map((t) => t.id).sort());
  });

  it('id ban, papan, dan kunci mengacu pada resource level', () => {
    if (layout?.kind !== 'triple') throw new Error('bukan layout triple');
    const resourceIds = new Set(level2_4.resources.map((r) => r.id));
    expect(level2_4.buffers?.[layout.belt.bufferId]).toBeDefined();
    expect(resourceIds.has(layout.board.boardId)).toBe(true);
    for (const id of layout.table.forkIds) {
      expect(resourceIds.has(id)).toBe(true);
    }
  });
});
