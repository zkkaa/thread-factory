import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PlayIcon, StarIcon } from '../components/icons/glyphs';
import { ICONS, type IconName } from '../components/icons/registry';

const NAMA_WAJIB: IconName[] = [
  'play',
  'pause',
  'step',
  'reset',
  'gear',
  'lock',
  'trash',
  'help',
  'menu',
  'back',
  'star',
  'arrow',
];

describe('ikon SVG', () => {
  it('registry memuat tepat dua belas ikon sesuai TASKS U-023', () => {
    expect(Object.keys(ICONS).sort()).toEqual([...NAMA_WAJIB].sort());
  });

  it('setiap ikon menjadi svg 24x24 yang disembunyikan dari pembaca layar', () => {
    for (const name of NAMA_WAJIB) {
      const Icon = ICONS[name];
      const html = renderToStaticMarkup(<Icon />);
      expect(html, name).toContain('<svg');
      expect(html, name).toContain('viewBox="0 0 24 24"');
      expect(html, name).toContain('aria-hidden="true"');
      expect(html, name).toContain('focusable="false"');
      expect(html, name).toContain('width="24"');
      // Ikon hanya dekorasi: nama tombol ada di aria-label IconButton.
      expect(html, name).not.toContain('aria-label');
      expect(html, name).not.toContain('<title');
    }
  });

  it('ukuran dan kelas dapat diatur', () => {
    const html = renderToStaticMarkup(<PlayIcon size={16} className="w-4" />);
    expect(html).toContain('width="16"');
    expect(html).toContain('height="16"');
    expect(html).toContain('class="w-4"');
  });

  it('ikon padat memakai fill, ikon garis memakai stroke', () => {
    const padat = renderToStaticMarkup(<PlayIcon />);
    expect(padat).toContain('fill="currentColor"');
    expect(padat).toContain('stroke="none"');
    const garis = renderToStaticMarkup(<ICONS.lock />);
    expect(garis).toContain('fill="none"');
    expect(garis).toContain('stroke="currentColor"');
  });

  it('bintang bisa berupa garis (kosong) atau padat', () => {
    expect(renderToStaticMarkup(<StarIcon />)).toContain('fill="currentColor"');
    const kosong = renderToStaticMarkup(<StarIcon outline />);
    expect(kosong).toContain('fill="none"');
    expect(kosong).toContain('stroke="currentColor"');
  });
});
