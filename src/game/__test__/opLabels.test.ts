import { describe, expect, it } from 'vitest';
import { describeOp } from '../opLabels';

describe('describeOp', () => {
  it('READ menjelaskan membaca ke catatan robot', () => {
    const info = describeOp({ op: 'READ', from: 'stok', into: 'r' });
    expect(info.short).toBe('READ');
    expect(info.description).toContain('catatan robot');
    expect(info.description).toContain('stok');
  });

  it('WORK, COMPUTE, WRITE punya penjelasan', () => {
    expect(describeOp({ op: 'WORK', ticks: 1 }).description).toContain(
      'Merakit',
    );
    expect(
      describeOp({ op: 'COMPUTE', reg: 'r', add: 1 }).description,
    ).toContain('1');
    expect(
      describeOp({ op: 'WRITE', reg: 'r', to: 'stok' }).description,
    ).toContain('stok');
  });

  it('instruksi lain memakai teks cadangan', () => {
    expect(describeOp({ op: 'LOCK', mutex: 'papan' }).short).toBe('LOCK');
  });
});
