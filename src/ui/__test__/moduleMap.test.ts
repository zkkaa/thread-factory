import { describe, expect, it } from 'vitest';
import type { ModuleCard } from '../modeSelect';
import { defaultModuleId, spotFor } from '../moduleMap';

function card(id: number, unlocked: boolean, cleared: number): ModuleCard {
  return {
    id,
    title: `Modul ${id}`,
    subtitle: '',
    description: '',
    clearedCount: cleared,
    totalCount: 5,
    unlocked,
    lockedReason: unlocked ? null : 'Selesaikan Level 1-4 dahulu',
  };
}

describe('defaultModuleId', () => {
  it('memilih modul terbuka yang belum tamat', () => {
    expect(defaultModuleId([card(1, true, 2), card(2, true, 0)])).toBe(1);
    expect(defaultModuleId([card(1, true, 5), card(2, true, 0)])).toBe(2);
  });

  it('memilih modul terbuka pertama bila semuanya tamat', () => {
    expect(defaultModuleId([card(1, true, 5), card(2, true, 5)])).toBe(1);
  });

  it('jatuh ke modul pertama bila tidak ada yang terbuka, null bila kosong', () => {
    expect(defaultModuleId([card(1, false, 0), card(2, false, 0)])).toBe(1);
    expect(defaultModuleId([])).toBeNull();
  });
});

describe('spotFor', () => {
  it('punya posisi untuk Modul 1 dan 2 dan null untuk modul lain', () => {
    expect(spotFor(1)).not.toBeNull();
    expect(spotFor(2)).not.toBeNull();
    expect(spotFor(99)).toBeNull();
  });
});
