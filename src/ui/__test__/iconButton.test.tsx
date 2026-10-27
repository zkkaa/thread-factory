import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { IconButton } from '../components/IconButton';
import { Tooltip } from '../components/Tooltip';
import { PlayIcon } from '../components/icons/glyphs';
import { ICONS, type IconName } from '../components/icons/registry';

describe('IconButton', () => {
  it('memakai label sebagai aria-label dan sebagai isi tooltip', () => {
    const html = renderToStaticMarkup(
      <IconButton label="Jalankan simulasi" icon={<PlayIcon />} />,
    );
    expect(html).toContain('aria-label="Jalankan simulasi"');
    expect(html).toContain('type="button"');
    // Muncul dua kali: aria-label dan teks tooltip.
    expect(html.split('Jalankan simulasi')).toHaveLength(3);
  });

  it('setiap tombol ikon dari semua ikon punya aria-label tidak kosong', () => {
    for (const name of Object.keys(ICONS) as IconName[]) {
      const Icon = ICONS[name];
      const html = renderToStaticMarkup(
        <IconButton label={`Tombol ${name}`} icon={<Icon />} />,
      );
      const match = /aria-label="([^"]+)"/.exec(html);
      expect(match, name).not.toBeNull();
      expect(match?.[1].trim().length, name).toBeGreaterThan(0);
    }
  });

  it('keadaan nonaktif menjadi atribut disabled', () => {
    const aktif = renderToStaticMarkup(
      <IconButton label="Step" icon={<PlayIcon />} />,
    );
    const mati = renderToStaticMarkup(
      <IconButton label="Step" icon={<PlayIcon />} disabled />,
    );
    expect(aktif).not.toContain('disabled=""');
    expect(mati).toContain('disabled=""');
  });

  it('nada primary dan danger memakai warna berbeda dari default', () => {
    const render = (tone: 'default' | 'primary' | 'danger') =>
      renderToStaticMarkup(
        <IconButton label="X" icon={<PlayIcon />} tone={tone} />,
      );
    expect(render('primary')).toContain('bg-sun-400');
    expect(render('danger')).toContain('text-ember-500');
    expect(render('default')).not.toContain('bg-sun-400');
  });
});

describe('Tooltip', () => {
  it('menampilkan teks, hanya visual (aria-hidden), muncul saat hover dan fokus', () => {
    const html = renderToStaticMarkup(
      <Tooltip label="Reset">
        <button type="button">x</button>
      </Tooltip>,
    );
    expect(html).toContain('Reset');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('invisible');
    expect(html).toContain('group-hover:visible');
    expect(html).toContain('group-has-[:focus-visible]:visible');
    expect(html).not.toContain('group-focus-within');
  });

  it('penempatan top dan bottom berbeda', () => {
    const render = (placement: 'top' | 'bottom' | 'left' | 'right') =>
      renderToStaticMarkup(
        <Tooltip label="T" placement={placement}>
          <span>x</span>
        </Tooltip>,
      );
    expect(render('top')).toContain('bottom-full');
    expect(render('bottom')).toContain('top-full');
    expect(render('left')).toContain('right-full');
    expect(render('right')).toContain('left-full');
  });
});
