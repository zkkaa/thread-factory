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

function render(index: number, reduceMotion = false): string {
  const moduleDef = MODULES[index];
  return renderToStaticMarkup(
    <ModuleIntroScreen
      navigation={buatNavigasi(moduleDef.id)}
      moduleDef={moduleDef}
      reduceMotion={reduceMotion}
    />,
  );
}

function hitung(html: string, pola: RegExp): number {
  return (html.match(pola) ?? []).length;
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
    expect(hitung(html, /<li /g)).toBe(MODULES[1].concepts.length);
  });

  it('menyebut jumlah level', () => {
    expect(render(0)).toContain('5 level');
    expect(render(1)).toContain('4 level');
  });

  it('memakai bangunan modul dan peta Peta Level modul itu sebagai latar', () => {
    const modul1 = render(0);
    expect(modul1).toContain('assets/ui/building-module-1.png');
    expect(modul1).toContain('assets/ui/map-levels-1.jpg');
    const modul2 = render(1);
    expect(modul2).toContain('assets/ui/building-module-2.png');
    expect(modul2).toContain('assets/ui/map-levels-2.jpg');
  });

  it('gambar hias disembunyikan dari pembaca layar', () => {
    const html = render(0);
    expect(html).toContain('alt="" aria-hidden="true"');
  });

  it('awalnya bar terisi dan tombol Lanjut belum ada', () => {
    const html = render(0);
    expect(html).toContain('intro-bar-fill');
    expect(html).toContain('Menyiapkan modul');
    expect(html).not.toContain('Lanjut</span>');
    expect(hitung(html, /<button/g)).toBe(0);
  });

  it('kurangi animasi: tanpa bar, tombol Lanjut langsung tampil tanpa efek pop', () => {
    const html = render(0, true);
    expect(html).not.toContain('intro-bar-fill');
    expect(html).toContain('<span>Lanjut</span>');
    expect(hitung(html, /<button/g)).toBe(1);
    expect(html).not.toContain('animate-star-pop');
  });
});
