import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Navigation } from '../navigation';
import { HomeScreen } from '../screens/HomeScreen';
import { UI_ASSETS } from '../uiAssets';

const navigation: Navigation = {
  screen: { id: 'home' },
  canGo: () => true,
  go: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  selectModeTab: vi.fn(),
};

describe('HomeScreen: gambar', () => {
  const html = renderToStaticMarkup(
    <HomeScreen navigation={navigation} hasProgress={false} />,
  );

  it('memakai logo dan latar dari aset', () => {
    expect(html).toContain(UI_ASSETS.logo);
    expect(html).toContain(UI_ASSETS.homeBackground);
  });

  it('judul tetap tersedia untuk pembaca layar walau logo berupa gambar', () => {
    expect(html).toContain('Thread Factory: Pabrik Rebutan');
  });

  it('menampilkan potret Pak Mandor asli, bukan placeholder', () => {
    expect(html).toContain('alt="Pak Mandor, ekspresi senang"');
    expect(html).not.toContain('menyusul');
  });
});
