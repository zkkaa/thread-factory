import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MODULES } from '../../levels/modules';
import type { UnlockContext } from '../../progress/unlocks';
import type { Navigation } from '../navigation';
import type { ModeTab } from '../screenState';
import { ModeSelectScreen } from '../screens/ModeSelectScreen';

function buatNavigasi(tab: ModeTab, izin = true): Navigation {
  return {
    screen: { id: 'mode', tab },
    canGo: () => izin,
    go: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    selectModeTab: vi.fn(),
  };
}

function buatKonteks(cleared: string[] = [], demoMode = false): UnlockContext {
  return {
    modules: MODULES,
    isCleared: (levelId) => cleared.includes(levelId),
    demoMode,
  };
}

const judul = (levelId: string) =>
  levelId === '1-1' ? 'Bug Papan Stok' : undefined;

function render(
  tab: ModeTab,
  cleared: string[] = [],
  demoMode = false,
  izin = true,
) {
  return renderToStaticMarkup(
    <ModeSelectScreen
      navigation={buatNavigasi(tab, izin)}
      context={buatKonteks(cleared, demoMode)}
      getLevelTitle={judul}
    />,
  );
}

function hitung(html: string, pola: RegExp): number {
  return (html.match(pola) ?? []).length;
}

const SEMUA_MODUL_1 = ['1-1', '1-2', '1-3', '1-4', '1-5'];

describe('ModeSelectScreen', () => {
  it('menampilkan tiga tab dengan satu yang terpilih', () => {
    const html = render('campaign');
    expect(html).toContain('Kampanye');
    expect(html).toContain('Sandbox');
    expect(html).toContain('Bandingkan');
    expect(hitung(html, /aria-selected="true"/g)).toBe(1);
    expect(hitung(html, /role="tab"/g)).toBe(3);
  });

  it('tab Kampanye: Modul 1 terpilih dengan panel progres', () => {
    const html = render('campaign', ['1-1']);
    expect(html).toContain('Sinkronisasi Dasar');
    expect(html).toContain('1 / 5 level');
    expect(hitung(html, /role="progressbar"/g)).toBe(1);
    expect(html).toContain('aria-valuenow="1"');
    expect(html).toContain('aria-valuemax="5"');
    expect(html).toContain('width:20%');
    expect(hitung(html, /aria-pressed="true"/g)).toBe(1);
    expect(html).toContain('Dipilih');
  });

  it('tab Kampanye: Modul 2 terkunci diberi label, badge, dan syarat', () => {
    const html = render('campaign', ['1-1']);
    expect(html).toContain(
      'aria-label="Modul 2: Masalah Klasik Konkurensi, terkunci, Selesaikan Level 1-4 dahulu"',
    );
    expect(html).toContain('Terkunci');
    // Bangunan terkunci tetap bisa diklik; Selanjutnya aktif untuk Modul 1.
    expect(hitung(html, /disabled=""/g)).toBe(0);
    expect(html).toContain('Selanjutnya');
  });

  it('tab Kampanye: setelah Modul 1 tamat, Modul 2 terpilih dan panelnya tampil', () => {
    const html = render('campaign', SEMUA_MODUL_1);
    expect(html).toContain('0 / 4 level');
    expect(html).toContain('aria-valuemax="4"');
    expect(html).toContain('aria-valuenow="0"');
    expect(html).toContain('width:0%');
    expect(html).toContain(
      'aria-label="Modul 2: Masalah Klasik Konkurensi, terbuka"',
    );
    expect(html).not.toContain('Terkunci');
  });

  it('tab Kampanye: mode demo membuka kedua modul', () => {
    const html = render('campaign', [], true);
    expect(html).not.toContain('Terkunci');
    expect(html).toContain('Modul 2: Masalah Klasik Konkurensi, terbuka');
    expect(hitung(html, /disabled=""/g)).toBe(0);
  });

  it('tab Kampanye: Selanjutnya nonaktif bila navigasi menolak', () => {
    const html = render('campaign', [], false, false);
    expect(hitung(html, /disabled=""/g)).toBe(1);
  });

  it('tab Sandbox: level tanpa data "Segera hadir", 1-1 terkunci sebelum selesai', () => {
    const html = render('sandbox');
    expect(html).toContain('Bug Papan Stok');
    expect(html).toContain('Selesaikan Level 1-1 dahulu');
    expect(hitung(html, /Segera hadir/g)).toBe(8);
    expect(html).not.toContain('>Buka<');
  });

  it('tab Bandingkan: Level 1-1 terbuka setelah selesai dan berlabel Buka', () => {
    const html = render('compare', ['1-1']);
    expect(html).not.toContain('Selesaikan Level 1-1 dahulu');
    expect(hitung(html, />Buka</g)).toBe(1);
    // 8 level tanpa data tetap nonaktif; baris 1-1 tidak.
    expect(hitung(html, /disabled=""/g)).toBe(8);
  });

  it('punya tombol Kembali', () => {
    expect(render('campaign')).toContain('Kembali');
  });
});
