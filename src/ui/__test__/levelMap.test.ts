import { describe, expect, it } from 'vitest';
import { MODULES } from '../../levels/modules';
import type { LevelProgress, ProgressData } from '../../progress/progressStore';
import type { UnlockContext } from '../../progress/unlocks';
import {
  ALL_DONE_MESSAGE,
  NONE_YET_MESSAGE,
  buildLevelMap,
  describeNode,
  focusLevelId,
  selectionAction,
} from '../levelMap';

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

/** Callback khusus untuk menguji tampilan ketika hanya Level 1-1 yang terdaftar. */
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

function susun(
  progress: ProgressData,
  getTitle: (levelId: string) => string | undefined,
  moduleIndex = 0,
  demoMode = false,
) {
  return buildLevelMap(
    MODULES[moduleIndex],
    buatKonteks(progress, demoMode),
    progress,
    getTitle,
  );
}

describe('buildLevelMap', () => {
  it('tanpa progres: 1-1 terbuka dan disorot, aksi Mulai Level 1-1', () => {
    const view = susun(buatProgress(), hanya11);
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
    const view = susun(buatProgress(), hanya11);
    expect(view.nodes[1]).toMatchObject({
      levelId: '1-2',
      title: null,
      status: 'comingSoon',
      note: 'Segera hadir',
      isNext: false,
    });
  });

  it('level ada tapi syaratnya belum selesai: terkunci dengan syarat', () => {
    const view = susun(buatProgress(), sampai12);
    expect(view.nodes[1]).toMatchObject({
      levelId: '1-2',
      status: 'locked',
      note: 'Selesaikan Level 1-1 dahulu',
    });
  });

  it('setelah 1-1 selesai: bintang tercatat, 1-2 menjadi berikutnya, aksi Lanjut', () => {
    const view = susun(buatProgress({ '1-1': selesai(2) }), sampai12);
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
    const view = susun(buatProgress({ '1-1': selesai(3) }), hanya11);
    expect(view.action).toBeNull();
    expect(view.message).toBe(ALL_DONE_MESSAGE);
  });

  it('modul tanpa satu pun level bisa dimainkan: pesan segera hadir', () => {
    const view = susun(buatProgress(), hanya11, 1, true);
    expect(view.nodes.every((node) => node.status === 'comingSoon')).toBe(true);
    expect(view.action).toBeNull();
    expect(view.message).toBe(NONE_YET_MESSAGE);
    expect(view.starsMax).toBe(12);
  });

  it('mode demo membuka level yang ada; berikutnya tetap yang pertama belum selesai', () => {
    const view = susun(buatProgress(), sampai12, 0, true);
    expect(view.nodes[1].status).toBe('open');
    expect(view.nodes[0].isNext).toBe(true);
    expect(view.nodes[1].isNext).toBe(false);
  });
});

describe('describeNode', () => {
  it('menyusun teks pembaca layar untuk tiap status', () => {
    const progress = buatProgress({ '1-1': selesai(2) });
    const view = susun(progress, sampai12);
    expect(describeNode(view.nodes[0])).toBe(
      'Level 1-1: Bug Papan Stok, 2 dari 3 bintang',
    );
    expect(describeNode(view.nodes[1])).toBe(
      'Level 1-2: Pintu Kebesaran, belum selesai',
    );
    expect(describeNode(view.nodes[2])).toBe('Level 1-3, segera hadir');
    const terkunci = susun(buatProgress(), sampai12);
    expect(describeNode(terkunci.nodes[1])).toBe(
      'Level 1-2: Pintu Kebesaran, terkunci',
    );
  });
});

describe('focusLevelId', () => {
  it('tanpa progres: level berikutnya (1-1)', () => {
    expect(focusLevelId(susun(buatProgress(), hanya11))).toBe('1-1');
  });

  it('ada level berikutnya setelah yang selesai: level berikutnya itu', () => {
    const view = susun(buatProgress({ '1-1': selesai(1) }), sampai12);
    expect(focusLevelId(view)).toBe('1-2');
  });

  it('semua selesai: level selesai terakhir', () => {
    const view = susun(buatProgress({ '1-1': selesai(3) }), hanya11);
    expect(focusLevelId(view)).toBe('1-1');
  });

  it('belum ada yang bisa dimainkan: level pertama', () => {
    const view = susun(buatProgress(), hanya11, 1, true);
    expect(focusLevelId(view)).toBe('2-1');
  });
});

describe('selectionAction', () => {
  it('level berikutnya tanpa progres: Mulai', () => {
    const view = susun(buatProgress(), hanya11);
    expect(selectionAction(view, '1-1')).toEqual({
      verb: 'Mulai',
      levelId: '1-1',
    });
  });

  it('level berikutnya setelah ada progres: Lanjut', () => {
    const view = susun(buatProgress({ '1-1': selesai(1) }), sampai12);
    expect(selectionAction(view, '1-2')).toEqual({
      verb: 'Lanjut',
      levelId: '1-2',
    });
  });

  it('level selesai: Ulangi', () => {
    const view = susun(buatProgress({ '1-1': selesai(3) }), hanya11);
    expect(selectionAction(view, '1-1')).toEqual({
      verb: 'Ulangi',
      levelId: '1-1',
    });
  });

  it('level terbuka tetapi bukan berikutnya (mode demo): Mulai', () => {
    const view = susun(buatProgress(), sampai12, 0, true);
    expect(selectionAction(view, '1-2')).toEqual({
      verb: 'Mulai',
      levelId: '1-2',
    });
  });

  it('level terkunci, segera hadir, atau tidak dikenal: null', () => {
    const terkunci = susun(buatProgress(), sampai12);
    expect(selectionAction(terkunci, '1-2')).toBeNull();
    expect(selectionAction(terkunci, '1-3')).toBeNull();
    expect(selectionAction(terkunci, '9-9')).toBeNull();
  });
});
