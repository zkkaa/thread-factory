import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { IntroPage } from '../../levels/types';
import { MandorDialog } from '../components/dialogs/MandorDialog';
import { pageInfo } from '../dialogPages';

const noop = (): void => {};

const PAGES: IntroPage[] = [
  { text: 'halaman-satu', mood: 'senang' },
  { text: 'halaman-dua' },
];

function render(pages: IntroPage[], title?: string): string {
  return renderToStaticMarkup(
    <MandorDialog pages={pages} title={title} onFinish={noop} onSkip={noop} />,
  );
}

describe('pageInfo', () => {
  it('menandai halaman terakhir dan memberi label', () => {
    expect(pageInfo(0, 3)).toEqual({
      index: 0,
      isLast: false,
      label: 'Halaman 1 / 3',
    });
    expect(pageInfo(2, 3).isLast).toBe(true);
  });

  it('merapikan indeks di luar jangkauan', () => {
    expect(pageInfo(9, 3).index).toBe(2);
    expect(pageInfo(-1, 3).index).toBe(0);
  });

  it('daftar kosong tidak error', () => {
    expect(pageInfo(0, 0).label).toBe('Halaman 1 / 1');
  });
});

describe('MandorDialog', () => {
  it('menampilkan halaman pertama, label, dan tombol Lanjut + Lewati', () => {
    const html = render(PAGES, 'Level 1-1');
    expect(html).toContain('halaman-satu');
    expect(html).not.toContain('halaman-dua');
    expect(html).toContain('Halaman 1 / 2');
    expect(html).toContain('Level 1-1');
    expect(html).toContain('>Lanjut</button>');
    expect(html).toContain('>Lewati</button>');
  });

  it('memakai ekspresi dari halaman, default netral', () => {
    expect(render(PAGES)).toContain('ekspresi senang');
    expect(render([{ text: 'x' }])).toContain('ekspresi netral');
  });

  it('satu halaman langsung menampilkan tombol Mulai', () => {
    expect(render([{ text: 'x' }])).toContain('>Mulai</button>');
  });

  it('tanpa halaman tidak menampilkan apa pun', () => {
    expect(render([])).toBe('');
  });

  it('berupa dialog modal berlabel', () => {
    const html = render(PAGES);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
  });
});
