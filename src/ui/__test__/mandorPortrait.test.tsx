import { existsSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MandorPortrait } from '../components/MandorPortrait';
import {
  MANDOR_PORTRAITS,
  portraitSrcFor,
  type PortraitSources,
} from '../mandorPortraits';

const NONE: PortraitSources = {
  netral: null,
  senang: null,
  sedih: null,
  berpikir: null,
};

describe('portraitSrcFor', () => {
  it('null bila tidak ada gambar sama sekali', () => {
    expect(portraitSrcFor('senang', NONE)).toBeNull();
  });

  it('memakai gambar ekspresi yang diminta', () => {
    const sources = { ...NONE, netral: 'n.png', senang: 's.png' };
    expect(portraitSrcFor('senang', sources)).toBe('s.png');
  });

  it('ekspresi tanpa gambar memakai netral', () => {
    const sources = { ...NONE, netral: 'n.png' };
    expect(portraitSrcFor('berpikir', sources)).toBe('n.png');
  });
});

describe('MandorPortrait', () => {
  it('tanpa gambar: tampil placeholder beranotasi, tanpa <img>', () => {
    const html = renderToStaticMarkup(
      <MandorPortrait mood="senang" sources={NONE} />,
    );
    expect(html).toContain('role="img"');
    expect(html).toContain('gambar menyusul');
    expect(html).not.toContain('<img');
  });

  it('dengan gambar: <img> memakai jalur dan alt berisi ekspresi', () => {
    const sources = { ...NONE, senang: 'assets/characters/mandor-senang.png' };
    const html = renderToStaticMarkup(
      <MandorPortrait mood="senang" sources={sources} />,
    );
    expect(html).toContain('<img');
    expect(html).toContain('src="assets/characters/mandor-senang.png"');
    expect(html).toContain('alt="Pak Mandor, ekspresi senang"');
    expect(html).not.toContain('gambar menyusul');
  });

  it('cadangan netral: alt tetap menyebut ekspresi yang diminta', () => {
    const sources = { ...NONE, netral: 'n.png' };
    const html = renderToStaticMarkup(
      <MandorPortrait mood="sedih" sources={sources} />,
    );
    expect(html).toContain('src="n.png"');
    expect(html).toContain('ekspresi sedih');
  });
});

describe('MANDOR_PORTRAITS (data aktual)', () => {
  it('setiap jalur yang diisi menunjuk berkas yang ada di public/', () => {
    for (const [mood, src] of Object.entries(MANDOR_PORTRAITS)) {
      if (src === null) continue;
      const url = new URL(`../../../public/${src}`, import.meta.url);
      expect(existsSync(url), `${mood}: ${src}`).toBe(true);
    }
  });
});
