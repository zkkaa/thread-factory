import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_SETTINGS,
  type SettingsData,
} from '../../progress/settingsStore';
import { APP_VERSION } from '../../version';
import { ASSET_CREDITS, GENERATOR_NOTE, TEAM_MEMBERS } from '../credits';
import type { Navigation } from '../navigation';
import { SettingsScreen } from '../screens/SettingsScreen';

function buatNavigasi(): Navigation {
  return {
    screen: { id: 'settings' },
    canGo: () => true,
    go: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    selectModeTab: vi.fn(),
  };
}

function render(settings: SettingsData = DEFAULT_SETTINGS): string {
  return renderToStaticMarkup(
    <SettingsScreen
      navigation={buatNavigasi()}
      settings={settings}
      onChange={vi.fn()}
      onResetProgress={vi.fn()}
    />,
  );
}

function hitung(html: string, pola: RegExp): number {
  return (html.match(pola) ?? []).length;
}

describe('SettingsScreen', () => {
  it('menampilkan judul dan semua bagian', () => {
    const html = render();
    expect(html).toContain('Pengaturan');
    expect(html).toContain('Volume suara');
    expect(html).toContain('Kurangi animasi');
    expect(html).toContain('Buka semua level (mode demo)');
    expect(html).toContain('Reset progres');
    expect(html).toContain('Kredit');
  });

  it('pengaturan awal: volume 70%, kedua sakelar mati dan berlabel teks', () => {
    const html = render();
    expect(html).toContain('70%');
    expect(html).toContain('value="70"');
    expect(hitung(html, /role="switch"/g)).toBe(2);
    expect(hitung(html, /aria-checked="false"/g)).toBe(2);
    expect(html).toContain('Mati');
    expect(html).not.toContain('Aktif');
  });

  it('sakelar aktif menampilkan aria-checked true dan teks Aktif', () => {
    const html = render({
      ...DEFAULT_SETTINGS,
      volume: 0.35,
      reduceMotion: true,
      demoMode: true,
    });
    expect(hitung(html, /aria-checked="true"/g)).toBe(2);
    expect(html).toContain('Aktif');
    expect(html).toContain('35%');
  });

  it('reset progres meminta konfirmasi: awalnya hanya tombol Hapus Progres', () => {
    const html = render();
    expect(html).toContain('Hapus Progres');
    expect(html).not.toContain('Yakin hapus semua progres?');
    expect(html).not.toContain('Ya, hapus');
  });

  it('menampilkan kredit aset, catatan generator, anggota tim, dan versi', () => {
    const html = render();
    for (const credit of ASSET_CREDITS) expect(html).toContain(credit.name);
    expect(html).toContain(GENERATOR_NOTE);
    for (const member of TEAM_MEMBERS) expect(html).toContain(member);
    expect(html).toContain(`v${APP_VERSION}`);
  });

  it('punya tombol Kembali', () => {
    expect(render()).toContain('Kembali');
  });
});
