import { describe, expect, it } from 'vitest';
import { level2_1 } from '../../levels/module2/level-2-1';
import { level1_1 } from '../../levels/module1/level-1-1';
import { deriveMission } from '../missionSummary';

describe('deriveMission untuk level berban (Level 2-1)', () => {
  it('menyebut jumlah barang, bukan variabel target placeholder', () => {
    const mission = deriveMission(level2_1);
    expect(mission.targetText).toContain('8 barang');
    expect(mission.targetText).not.toContain('barang = 0');
  });

  it('rincian bintang 1 menyebut jatuh dan ban kosong', () => {
    const first = deriveMission(level2_1).stars[0];
    expect(first?.text).toContain('8 barang');
  });

  it('level tanpa ban tetap memakai variabel target', () => {
    expect(deriveMission(level1_1).targetText).toBe('stok = 10');
  });
});