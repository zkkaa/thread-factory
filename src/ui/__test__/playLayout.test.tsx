import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PlayLayout } from '../components/hud/PlayLayout';

describe('PlayLayout', () => {
  it('merender kanvas dan semua slot yang diberikan', () => {
    const html = renderToStaticMarkup(
      <PlayLayout
        canvas={<i>KANVAS</i>}
        topLeft={<i>TL</i>}
        topRight={<i>TR</i>}
        bottomLeft={<i>BL</i>}
        bottomCenter={<i>BC</i>}
        bottomRight={<i>BR</i>}
        overlay={<i>DIALOG</i>}
      />,
    );
    for (const name of [
      'canvas',
      'top-left',
      'top-right',
      'bottom-left',
      'bottom-center',
      'bottom-right',
    ]) {
      expect(html).toContain(`data-hud-slot="${name}"`);
    }
    for (const text of ['KANVAS', 'TL', 'TR', 'BL', 'BC', 'BR', 'DIALOG']) {
      expect(html).toContain(text);
    }
  });

  it('tidak merender slot yang tidak diberikan', () => {
    const html = renderToStaticMarkup(
      <PlayLayout canvas={<i>KANVAS</i>} topRight={<i>TR</i>} />,
    );
    expect(html).toContain('data-hud-slot="top-right"');
    expect(html).not.toContain('data-hud-slot="top-left"');
    expect(html).not.toContain('data-hud-slot="bottom-center"');
  });

  it('menaruh kanvas lebih dulu dari HUD dan dialog paling akhir', () => {
    const html = renderToStaticMarkup(
      <PlayLayout
        canvas={<i>KANVAS</i>}
        topLeft={<i>TL</i>}
        overlay={<i>DIALOG</i>}
      />,
    );
    expect(html.indexOf('KANVAS')).toBeLessThan(html.indexOf('TL'));
    expect(html.indexOf('TL')).toBeLessThan(html.indexOf('DIALOG'));
  });

  it('tidak memakai lebar tetap dan menyembunyikan luapan (tanpa scroll)', () => {
    const html = renderToStaticMarkup(<PlayLayout canvas={<i>K</i>} />);
    expect(html).toContain('overflow-hidden');
    expect(html).toContain('pointer-events-none');
    expect(html).not.toMatch(/w-\[\d+px\]/);
  });
});
