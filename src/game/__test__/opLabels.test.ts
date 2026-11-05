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

  it('SPIN_UNTIL menjelaskan busy waiting dan baterai', () => {
    const info = describeOp({
      op: 'SPIN_UNTIL',
      variable: 'barang',
      atLeast: 3,
    });
    expect(info.short).toBe('SPIN');
    expect(info.description).toContain('barang');
    expect(info.description).toContain('3');
    expect(info.description).toContain('busy waiting');
  });

  it('instruksi lain memakai teks cadangan', () => {
    expect(describeOp({ op: 'LOCK', mutex: 'papan' }).short).toBe('LOCK');
  });
});
