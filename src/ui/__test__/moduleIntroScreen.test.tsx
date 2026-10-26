import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MODULES } from '../../levels/modules';
import type { Navigation } from '../navigation';
import { ModuleIntroScreen } from '../screens/ModuleIntroScreen';

function buatNavigasi(moduleId: number): Navigation {
  return {
    screen: { id: 'moduleIntro', moduleId },
    canGo: () => true,
    go: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    selectModeTab: vi.fn(),
  };
}

function render(index: number): string {
  const moduleDef = MODULES[index];
  return renderToStaticMarkup(
    <ModuleIntroScreen
      navigation={buatNavigasi(moduleDef.id)}
      moduleDef={moduleDef}
    />,
  );
}

describe('ModuleIntroScreen', () => {
  it('menampilkan judul, subjudul, dan deskripsi modul', () => {
    const html = render(0);
    expect(html).toContain('Modul 1');
    expect(html).toContain('Sinkronisasi Dasar');
    expect(html).toContain('Robot-robot pabrik berebut papan stok');
  });

  it('menampilkan semua konsep modul sebagai daftar', () => {
    const html = render(1);
    for (const concept of MODULES[1].concepts) {
      expect(html).toContain(concept);
    }
    expect(html).toContain('aria-label="Konsep yang akan dipelajari"');
  });

  it('punya tombol Lewati dan menyebut jumlah level', () => {
    const html = render(0);
    expect(html).toContain('Lewati');
    expect(html).toContain('5 level');
    expect(render(1)).toContain('4 level');
  });
});
