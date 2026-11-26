import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ComicPanel } from '../components/comic/ComicPanel';

const base = {
  levelId: '1-2',
  title: 'Pintu Kebesaran',
  note: 'Selesaikan Level 1-1 dahulu',
  accent: 'bg-sun-400',
  index: 0,
  reduceMotion: false,
  onOpen: () => undefined,
};

describe('ComicPanel', () => {
  it('level terbuka: bisa diklik dan punya aria-label', () => {
    const html = renderToStaticMarkup(<ComicPanel {...base} locked={false} />);
    expect(html).toContain('aria-label="Level 1-2: Pintu Kebesaran, buka"');
    expect(html).not.toContain('disabled');
    expect(html).not.toContain('TERKUNCI');
  });

  it('level terkunci: nonaktif, ada selotip dan syarat pembukaan', () => {
    const html = renderToStaticMarkup(<ComicPanel {...base} locked />);
    expect(html).toContain('disabled');
    expect(html).toContain('TERKUNCI');
    expect(html).toContain('Selesaikan Level 1-1 dahulu');
    expect(html).toContain('terkunci');
  });

  it('syarat pembukaan hanya tampil sekali (tidak diduplikasi ke aria-label)', () => {
    const html = renderToStaticMarkup(
      <ComicPanel {...base} title={null} note="Segera hadir" locked />,
    );
    expect(html).toContain('aria-label="Level 1-2, terkunci"');
    expect(html.match(/Segera hadir/g)).toHaveLength(1);
  });
});
