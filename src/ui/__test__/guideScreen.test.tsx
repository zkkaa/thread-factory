import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  GLOSSARY,
  GUIDE_STEPS,
  HUD_CONTROLS,
  ROBOT_STATES,
} from '../guideContent';
import type { Navigation } from '../navigation';
import { GuideScreen } from '../screens/GuideScreen';

function buatNavigasi(): Navigation {
  return {
    screen: { id: 'guide' },
    canGo: () => true,
    go: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    selectModeTab: vi.fn(),
  };
}

function render(): string {
  return renderToStaticMarkup(<GuideScreen navigation={buatNavigasi()} />);
}

describe('GuideScreen', () => {
  it('menampilkan judul dan keempat bagian', () => {
    const html = render();
    expect(html).toContain('Panduan');
    expect(html).toContain('Cara bermain');
    expect(html).toContain('Arti status robot');
    expect(html).toContain('Kontrol dan HUD');
    expect(html).toContain('Glosarium');
  });

  it('menampilkan tiga langkah bermain', () => {
    const html = render();
    for (const step of GUIDE_STEPS) expect(html).toContain(step.title);
    expect(html).toContain('Langkah 3');
  });

  it('menampilkan keempat status dengan label teks, bukan hanya warna', () => {
    const html = render();
    for (const info of ROBOT_STATES) expect(html).toContain(info.state);
  });

  it('menampilkan semua kontrol HUD', () => {
    const html = render();
    for (const control of HUD_CONTROLS) expect(html).toContain(control.label);
  });

  it('menampilkan ketujuh istilah glosarium', () => {
    const html = render();
    for (const entry of GLOSSARY) expect(html).toContain(entry.term);
  });

  it('punya tombol Kembali', () => {
    expect(render()).toContain('Kembali');
  });
});
