import { describe, expect, it } from 'vitest';
import { MODULES } from '../../levels/modules';
import type { LevelProgress, ProgressData } from '../../progress/progressStore';
import type { UnlockContext } from '../../progress/unlocks';
import { ALL_DONE_MESSAGE, NONE_YET_MESSAGE, buildLevelMap } from '../levelMap';

function buatProgress(
  levels: Record<string, LevelProgress> = {},
): ProgressData {
  return { version: 1, levels };
}

function buatKonteks(progress: ProgressData, demoMode = false): UnlockContext {
  return {
    modules: MODULES,
    isCleared: (levelId) => progress.levels[levelId]?.cleared === true,
    demoMode,
  };
}

/** Kondisi repo saat ini: hanya Level 1-1 yang datanya ada. */
const hanya11 = (levelId: string) =>
  levelId === '1-1' ? 'Bug Papan Stok' : undefined;

/** Seandainya Level 1-2 sudah dibuat. */
const sampai12 = (levelId: string) =>
  levelId === '1-1'
    ? 'Bug Papan Stok'
    : levelId === '1-2'
      ? 'Pintu Kebesaran'
      : undefined;

const selesai = (stars: 1 | 2 | 3): LevelProgress => ({
  bestStars: stars,
  cleared: true,
});

describe('buildLevelMap', () => {
  it('tanpa progres: 1-1 terbuka dan disorot, aksi Mulai Level 1-1', () => {
    const progress = buatProgress();
    const view = buildLevelMap(
      MODULES[0],
      buatKonteks(progress),
      progress,
      hanya11,
    );
    expect(view.nodes).toHaveLength(5);
    expect(view.nodes[0]).toMatchObject({
      levelId: '1-1',
      status: 'open',
      isNext: true,
      stars: 0,
    });
    expect(view.action).toEqual({ verb: 'Mulai', levelId: '1-1' });
    expect(view.message).toBeNull();
    expect(view.starsEarned).toBe(0);
    expect(view.starsMax).toBe(15);
  });

  it('level tanpa data berstatus comingSoon dengan catatan "Segera hadir"', () => {
    const progress = buatProgress();
    const view = buildLevelMap(
      MODULES[0],
      buatKonteks(progress),
      progress,
      hanya11,
    );
    expect(view.nodes[1]).toMatchObject({
      levelId: '1-2',
      title: null,
      status: 'comingSoon',
      note: 'Segera hadir',
      isNext: false,
    });
  });

  it('level ada tapi syaratnya belum selesai: terkunci dengan syarat', () => {
    const progress = buatProgress();
    const view = buildLevelMap(
      MODULES[0],
      buatKonteks(progress),
      progress,
      sampai12,
    );
    expect(view.nodes[1]).toMatchObject({
      levelId: '1-2',
      status: 'locked',
      note: 'Selesaikan Level 1-1 dahulu',
    });
  });

  it('setelah 1-1 selesai: bintang tercatat, 1-2 menjadi berikutnya, aksi Lanjut', () => {
    const progress = buatProgress({ '1-1': selesai(2) });
    const view = buildLevelMap(
      MODULES[0],
      buatKonteks(progress),
      progress,
      sampai12,
    );
    expect(view.nodes[0]).toMatchObject({
      status: 'cleared',
      stars: 2,
      isNext: false,
    });
    expect(view.nodes[1]).toMatchObject({ status: 'open', isNext: true });
    expect(view.action).toEqual({ verb: 'Lanjut', levelId: '1-2' });
    expect(view.starsEarned).toBe(2);
  });

  it('semua level yang ada selesai: tanpa aksi, pesan semua selesai', () => {
    const progress = buatProgress({ '1-1': selesai(3) });
    const view = buildLevelMap(
      MODULES[0],
      buatKonteks(progress),
      progress,
      hanya11,
    );
    expect(view.action).toBeNull();
    expect(view.message).toBe(ALL_DONE_MESSAGE);
  });

  it('modul tanpa satu pun level bisa dimainkan: pesan segera hadir', () => {
    const progress = buatProgress();
    const view = buildLevelMap(
      MODULES[1],
      buatKonteks(progress, true),
      progress,
      hanya11,
    );
    expect(view.nodes.every((node) => node.status === 'comingSoon')).toBe(true);
    expect(view.action).toBeNull();
    expect(view.message).toBe(NONE_YET_MESSAGE);
    expect(view.starsMax).toBe(12);
  });

  it('mode demo membuka level yang ada; berikutnya tetap yang pertama belum selesai', () => {
    const progress = buatProgress();
    const view = buildLevelMap(
      MODULES[0],
      buatKonteks(progress, true),
      progress,
      sampai12,
    );
    expect(view.nodes[1].status).toBe('open');
    expect(view.nodes[0].isNext).toBe(true);
    expect(view.nodes[1].isNext).toBe(false);
  });
});
