import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { APP_VERSION } from '../../version';
import type { Navigation } from '../navigation';
import { HomeScreen } from '../screens/HomeScreen';

function buatNavigasi(): Navigation {
  return {
    screen: { id: 'home' },
    canGo: () => true,
    go: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    selectModeTab: vi.fn(),
  };
}

describe('HomeScreen', () => {
  it('tanpa progres menampilkan Mulai Game, Panduan, dan Pengaturan', () => {
    const html = renderToStaticMarkup(
      <HomeScreen navigation={buatNavigasi()} hasProgress={false} />,
    );
    expect(html).toContain('Mulai Game');
    expect(html).not.toContain('Lanjutkan');
    expect(html).toContain('Panduan');
    expect(html).toContain('Pengaturan');
  });

  it('dengan progres tombol utama menjadi Lanjutkan', () => {
    const html = renderToStaticMarkup(
      <HomeScreen navigation={buatNavigasi()} hasProgress />,
    );
    expect(html).toContain('Lanjutkan');
    expect(html).not.toContain('Mulai Game');
  });

  it('menampilkan judul, nomor versi, dan menu berlabel', () => {
    const html = renderToStaticMarkup(
      <HomeScreen navigation={buatNavigasi()} hasProgress={false} />,
    );
    expect(html).toContain('Thread Factory');
    expect(html).toContain('Pabrik Rebutan');
    expect(html).toContain(`v${APP_VERSION}`);
    expect(html).toContain('aria-label="Menu utama"');
  });
});