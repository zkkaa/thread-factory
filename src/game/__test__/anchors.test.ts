import { describe, expect, it } from 'vitest';
import type { InstructionOrigin } from '../../engine/tools';
import { computeAnchors } from '../anchors';
import { layout1_1 } from '../layouts/level-1-1.layout';

const original = (index: number): InstructionOrigin => ({
  kind: 'original',
  index,
});

describe('computeAnchors', () => {
  it('memetakan instruksi asli ke checkpoint sesuai urutan', () => {
    const anchors = computeAnchors([0, 1, 2, 3].map(original), layout1_1);
    expect(anchors.map((a) => a.kind)).toEqual(Array(4).fill('checkpoint'));
    expect(anchors.map((a) => a.fraction)).toEqual(layout1_1.checkpoints);
  });

  it('LOCK/UNLOCK sisipan berada di gerbang pada slotnya', () => {
    const origins: InstructionOrigin[] = [
      original(0),
      { kind: 'inserted', op: 'LOCK', slot: 1 },
      original(1),
      original(2),
      original(3),
      { kind: 'inserted', op: 'UNLOCK', slot: 4 },
    ];
    const anchors = computeAnchors(origins, layout1_1);
    expect(anchors.map((a) => a.kind)).toEqual([
      'checkpoint',
      'gate',
      'checkpoint',
      'checkpoint',
      'checkpoint',
      'gate',
    ]);
    expect(anchors[1]?.fraction).toBe(layout1_1.slots[1]);
    expect(anchors[5]?.fraction).toBe(layout1_1.slots[4]);
  });

  it('program kosong menghasilkan daftar kosong', () => {
    expect(computeAnchors([], layout1_1)).toEqual([]);
  });

  it('melempar error bila checkpoint tidak ada di layout', () => {
    expect(() => computeAnchors([original(99)], layout1_1)).toThrow(
      'Checkpoint 99',
    );
  });

  it('melempar error bila slot tidak ada di layout', () => {
    const origin: InstructionOrigin = {
      kind: 'inserted',
      op: 'LOCK',
      slot: 99,
    };
    expect(() => computeAnchors([origin], layout1_1)).toThrow('Slot 99');
  });
});
