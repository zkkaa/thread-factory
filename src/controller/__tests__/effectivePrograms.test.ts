import { describe, expect, it } from 'vitest';
import { level1_1 } from '../../levels/module1/level-1-1';
import { effectivePrograms } from '../effectivePrograms';

describe('effectivePrograms', () => {
  it('tanpa alat: program tidak berubah dan semua asal berjenis original', () => {
    const { threads, origins } = effectivePrograms(level1_1, []);
    expect(threads.map((t) => t.program)).toEqual(
      level1_1.threads.map((t) => t.program),
    );
    for (const thread of level1_1.threads) {
      const list = origins[thread.id];
      expect(list).toHaveLength(thread.program.length);
      expect(list?.every((o) => o.kind === 'original')).toBe(true);
    }
  });
});
