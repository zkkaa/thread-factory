import { describe, expect, it } from 'vitest';
import { MODULES } from '../../levels/modules';
import type { UnlockContext } from '../../progress/unlocks';
import { buildLevelGroups, buildModuleCards } from '../modeSelect';

function buatKonteks(cleared: string[] = [], demoMode = false): UnlockContext {
  return {
    modules: MODULES,
    isCleared: (levelId) => cleared.includes(levelId),
    demoMode,
  };
}

/** Hanya Level 1-1 yang datanya ada, seperti kondisi repo saat ini. */
const judul = (levelId: string) =>
  levelId === '1-1' ? 'Bug Papan Stok' : undefined;

describe('buildModuleCards', () => {
  it('tanpa progres: Modul 1 terbuka 0/5, Modul 2 terkunci dengan syarat', () => {
    const [modul1, modul2] = buildModuleCards(buatKonteks());
    expect(modul1.unlocked).toBe(true);
    expect(modul1.lockedReason).toBeNull();
    expect(modul1.clearedCount).toBe(0);
    expect(modul1.totalCount).toBe(5);
    expect(modul2.unlocked).toBe(false);
    expect(modul2.lockedReason).toBe('Selesaikan Level 1-4 dahulu');
  });

  it('menghitung level yang selesai per modul', () => {
    const [modul1] = buildModuleCards(buatKonteks(['1-1', '1-2']));
    expect(modul1.clearedCount).toBe(2);
  });

  it('Modul 2 terbuka setelah Level 1-4 selesai', () => {
    const [, modul2] = buildModuleCards(buatKonteks(['1-4']));
    expect(modul2.unlocked).toBe(true);
    expect(modul2.lockedReason).toBeNull();
  });

  it('mode demo membuka semua modul', () => {
    const [, modul2] = buildModuleCards(buatKonteks([], true));
    expect(modul2.unlocked).toBe(true);
    expect(modul2.lockedReason).toBeNull();
  });
});

describe('buildLevelGroups', () => {
  it('mengelompokkan level per modul', () => {
    const groups = buildLevelGroups(buatKonteks(), judul);
    expect(groups.map((group) => group.rows.length)).toEqual([5, 4]);
    expect(groups[0].heading).toBe('Modul 1: Sinkronisasi Dasar');
  });

  it('level belum selesai terkunci dengan syarat menyelesaikannya', () => {
    const [grup1] = buildLevelGroups(buatKonteks(), judul);
    expect(grup1.rows[0]).toMatchObject({
      levelId: '1-1',
      title: 'Bug Papan Stok',
      unlocked: false,
      note: 'Selesaikan Level 1-1 dahulu',
    });
  });

  it('level yang sudah selesai terbuka tanpa catatan', () => {
    const [grup1] = buildLevelGroups(buatKonteks(['1-1']), judul);
    expect(grup1.rows[0].unlocked).toBe(true);
    expect(grup1.rows[0].note).toBeNull();
  });

  it('level tanpa data selalu "Segera hadir", juga saat mode demo', () => {
    const [grup1] = buildLevelGroups(buatKonteks([], true), judul);
    expect(grup1.rows[1]).toMatchObject({
      levelId: '1-2',
      title: null,
      unlocked: false,
      note: 'Segera hadir',
    });
    expect(grup1.rows[0].unlocked).toBe(true);
  });
});
