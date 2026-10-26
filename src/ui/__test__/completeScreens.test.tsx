import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MODULES } from '../../levels/modules';
import type { LevelProgress, ProgressData } from '../../progress/progressStore';
import type { UnlockContext } from '../../progress/unlocks';
import type { Navigation } from '../navigation';
import type { Screen } from '../screenState';
import { GameCompleteScreen } from '../screens/GameCompleteScreen';
import { ModuleCompleteScreen } from '../screens/ModuleCompleteScreen';

function buatNavigasi(
  screen: Screen,
  canGo: (target: Screen) => boolean = () => true,
): Navigation {
  return {
    screen,
    canGo,
    go: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    selectModeTab: vi.fn(),
  };
}

function buatProgress(levels: Record<string, number>): ProgressData {
  const data: Record<string, LevelProgress> = {};
  for (const [id, stars] of Object.entries(levels)) {
    data[id] = { bestStars: stars as 1 | 2 | 3, cleared: true };
  }
  return { version: 1, levels: data };
}

function buatKonteks(progress: ProgressData): UnlockContext {
  return {
    modules: MODULES,
    isCleared: (levelId) => progress.levels[levelId]?.cleared === true,
    demoMode: false,
  };
}

const konsep = (levelId: string): readonly string[] | undefined =>
  levelId === '1-1' ? ['Race condition', 'Mutex'] : undefined;

function hitung(html: string, pola: RegExp): number {
  return (html.match(pola) ?? []).length;
}

const MODUL1_SELESAI = buatProgress({
  '1-1': 3,
  '1-2': 2,
  '1-3': 3,
  '1-4': 1,
  '1-5': 2,
});

function renderModul(
  index: number,
  progress: ProgressData,
  canGo?: (target: Screen) => boolean,
): string {
  const moduleDef = MODULES[index];
  return renderToStaticMarkup(
    <ModuleCompleteScreen
      navigation={buatNavigasi(
        { id: 'moduleComplete', moduleId: moduleDef.id },
        canGo,
      )}
      moduleDef={moduleDef}
      context={buatKonteks(progress)}
      progress={progress}
      getLevelConcepts={konsep}
    />,
  );
}

describe('ModuleCompleteScreen', () => {
  it('Modul 1: judul, bintang modul, konsep, dan Modul 2 terbuka', () => {
    const html = renderModul(0, MODUL1_SELESAI);
    expect(html).toContain('Modul 1 selesai!');
    expect(html).toContain('Bintang modul: 11 / 15');
    expect(html).toContain('Race condition');
    expect(html).toContain('Modul 2 terbuka!');
    expect(html).toContain('Lanjut ke Modul Berikutnya');
    expect(html).toContain('Peta Level');
  });

  it('modul terakhir: tombol menuju akhir game, tanpa Modul Berikutnya', () => {
    const progress = buatProgress({ '2-1': 3, '2-2': 3, '2-3': 3, '2-4': 3 });
    const html = renderModul(1, progress);
    expect(html).toContain('Lanjut ke Akhir Game');
    expect(html).not.toContain('Lanjut ke Modul Berikutnya');
    expect(html).not.toContain('terbuka!');
    expect(html).toContain('Bintang modul: 12 / 12');
  });

  it('tombol lanjut nonaktif bila modul berikutnya belum boleh dimasuki', () => {
    const html = renderModul(
      0,
      MODUL1_SELESAI,
      (target) => target.id !== 'moduleIntro',
    );
    expect(hitung(html, /disabled=""/g)).toBe(1);
  });

  it('tanpa progres (mode demo): tetap tampil dengan konsep modul', () => {
    const html = renderModul(0, buatProgress({}));
    expect(html).toContain('Bintang modul: 0 / 15');
    expect(html).toContain(MODULES[0].concepts[0]);
  });
});

describe('GameCompleteScreen', () => {
  function renderGame(progress: ProgressData): string {
    return renderToStaticMarkup(
      <GameCompleteScreen
        navigation={buatNavigasi({ id: 'gameComplete' })}
        modules={MODULES}
        progress={progress}
        getLevelConcepts={konsep}
      />,
    );
  }

  it('menampilkan ucapan selamat dan total bintang dari 27', () => {
    const html = renderGame(buatProgress({ '1-1': 3, '1-2': 2 }));
    expect(html).toContain('Selamat, Mandor!');
    expect(html).toContain('Total bintang: 5 / 27');
  });

  it('menampilkan konsep dari level selesai dan konsep modul yang belum ada progres', () => {
    const html = renderGame(buatProgress({ '1-1': 3 }));
    expect(html).toContain('Race condition');
    expect(html).toContain('Deadlock dan kondisi Coffman');
  });

  it('punya lima tombol: Sandbox, Bandingkan, Ulangi Level, Kredit, Beranda', () => {
    const html = renderGame(buatProgress({}));
    for (const label of [
      'Sandbox',
      'Bandingkan',
      'Ulangi Level',
      'Kredit',
      'Beranda',
    ]) {
      expect(html).toContain(label);
    }
    expect(hitung(html, /<button/g)).toBe(5);
  });
});
