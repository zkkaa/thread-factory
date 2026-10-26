import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MODULES } from '../../levels/modules';
import type { LevelProgress, ProgressData } from '../../progress/progressStore';
import type { UnlockContext } from '../../progress/unlocks';
import type { Navigation } from '../navigation';
import { LevelMapScreen } from '../screens/LevelMapScreen';

function buatNavigasi(moduleId: number): Navigation {
  return {
    screen: { id: 'levelMap', moduleId },
    canGo: () => true,
    go: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    selectModeTab: vi.fn(),
  };
}

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

const hanya11 = (levelId: string) =>
  levelId === '1-1' ? 'Bug Papan Stok' : undefined;

function render(moduleIndex: number, progress: ProgressData, demoMode = false) {
  const moduleDef = MODULES[moduleIndex];
  return renderToStaticMarkup(
    <LevelMapScreen
      navigation={buatNavigasi(moduleDef.id)}
      moduleDef={moduleDef}
      context={buatKonteks(progress, demoMode)}
      progress={progress}
      getLevelTitle={hanya11}
    />,
  );
}

function hitung(html: string, pola: RegExp): number {
  return (html.match(pola) ?? []).length;
}

describe('LevelMapScreen', () => {
  it('tanpa progres: tombol Mulai Level 1-1, level lain nonaktif', () => {
    const html = render(0, buatProgress());
    expect(html).toContain('Modul 1');
    expect(html).toContain('Sinkronisasi Dasar');
    expect(html).toContain('Mulai Level 1-1');
    expect(html).toContain('Berikutnya');
    expect(html).toContain(
      'aria-label="Level 1-1: Bug Papan Stok, belum selesai"',
    );
    expect(hitung(html, /Segera hadir/g)).toBe(4);
    // 4 titik "segera hadir" nonaktif; titik 1-1 dan tombol aksi aktif.
    expect(hitung(html, /disabled=""/g)).toBe(4);
  });

  it('level selesai menampilkan bintang untuk pembaca layar dan total modul', () => {
    const html = render(
      0,
      buatProgress({ '1-1': { bestStars: 2, cleared: true } }),
    );
    expect(html).toContain(
      'aria-label="Level 1-1: Bug Papan Stok, 2 dari 3 bintang"',
    );
    expect(html).toContain('2 / 15');
    expect(html).toContain('★★☆');
  });

  it('semua level tersedia selesai: tanpa tombol aksi, ada pesan', () => {
    const html = render(
      0,
      buatProgress({ '1-1': { bestStars: 3, cleared: true } }),
    );
    expect(html).not.toContain('Mulai Level');
    expect(html).not.toContain('Lanjut Level');
    expect(html).toContain('Semua level yang tersedia sudah selesai');
  });

  it('modul tanpa level siap: pesan segera hadir dan semua titik nonaktif', () => {
    const html = render(1, buatProgress(), true);
    expect(html).toContain('Level modul ini segera hadir.');
    expect(hitung(html, /disabled=""/g)).toBe(4);
  });

  it('punya tombol Kembali dan catatan mengulang level', () => {
    const html = render(0, buatProgress());
    expect(html).toContain('Kembali');
    expect(html).toContain('bisa diulang untuk mengejar bintang');
  });
});
