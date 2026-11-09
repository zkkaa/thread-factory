import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MODULES } from '../../levels/modules';
import { findLevelById } from '../../levels';
import type { LevelProgress, ProgressData } from '../../progress/progressStore';
import type { UnlockContext } from '../../progress/unlocks';
import type { Navigation } from '../navigation';
import { LevelMapScreen } from '../screens/LevelMapScreen';

function buatNavigasi(moduleId: number, canGo = true): Navigation {
  return {
    screen: { id: 'levelMap', moduleId },
    canGo: () => canGo,
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

function render(
  moduleIndex: number,
  progress: ProgressData,
  demoMode = false,
  canGo = true,
) {
  const moduleDef = MODULES[moduleIndex];
  return renderToStaticMarkup(
    <LevelMapScreen
      navigation={buatNavigasi(moduleDef.id, canGo)}
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
  it('menampilkan Level 1-5 sebagai level tersedia setelah terdaftar', () => {
    const moduleDef = MODULES[0];
    const html = renderToStaticMarkup(
      <LevelMapScreen
        navigation={buatNavigasi(moduleDef.id)}
        moduleDef={moduleDef}
        context={buatKonteks(buatProgress())}
        progress={buatProgress()}
        getLevelTitle={(levelId) => findLevelById(levelId)?.title}
      />,
    );

    expect(html).toContain('aria-label="Level 1-5: Lini Gabungan, terkunci"');
    expect(html).not.toContain('Level 1-5, segera hadir');
  });

  it('tanpa progres: 1-1 dipilih dan berikutnya, tombol Mulai Level 1-1 aktif', () => {
    const html = render(0, buatProgress());
    expect(html).toContain('Modul 1');
    expect(html).toContain('Sinkronisasi Dasar');
    expect(html).toContain('Mulai Level 1-1');
    expect(html).toContain('Berikutnya');
    expect(html).toContain(
      'aria-label="Level 1-1: Bug Papan Stok, belum selesai"',
    );
    // Lima penanda level; hanya satu yang dipilih.
    expect(hitung(html, /aria-pressed=/g)).toBe(5);
    expect(hitung(html, /aria-pressed="true"/g)).toBe(1);
    expect(hitung(html, /, segera hadir"/g)).toBe(4);
    expect(html).not.toContain('disabled=""');
  });

  it('level selesai: bintang untuk pembaca layar, total modul, dan tombol Ulangi', () => {
    const html = render(
      0,
      buatProgress({ '1-1': { bestStars: 2, cleared: true } }),
    );
    expect(html).toContain(
      'aria-label="Level 1-1: Bug Papan Stok, 2 dari 3 bintang"',
    );
    expect(html).toContain('2 / 15');
    expect(html).toContain('★★☆');
    expect(html).toContain('Selesai');
    expect(html).toContain('Ulangi Level 1-1');
    expect(html).toContain('Semua level yang tersedia sudah selesai');
  });

  it('modul tanpa level siap: pesan segera hadir dan tombol nonaktif', () => {
    const html = render(1, buatProgress(), true);
    expect(html).toContain('Level modul ini segera hadir.');
    expect(hitung(html, /, segera hadir"/g)).toBe(4);
    expect(html).toContain('Belum bisa dimainkan');
    expect(html).toContain('disabled=""');
    expect(html).not.toContain('Mulai Level');
  });

  it('navigation.canGo false menonaktifkan tombol aksi', () => {
    const html = render(0, buatProgress(), false, false);
    expect(html).toContain('Mulai Level 1-1');
    expect(html).toContain('disabled=""');
  });

  it('punya tombol Kembali dan catatan mengulang level', () => {
    const html = render(0, buatProgress());
    expect(html).toContain('Kembali');
    expect(html).toContain('bisa diulang untuk mengejar bintang');
  });

  it('tanpa tab Kampanye, Sandbox, dan Bandingkan', () => {
    const html = render(0, buatProgress());
    expect(html).not.toContain('Sandbox');
    expect(html).not.toContain('Bandingkan');
  });
});
