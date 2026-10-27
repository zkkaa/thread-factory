import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { LogEntry } from '../eventLog';
import { LogHudView } from '../components/hud/LogHud';

function entry(id: number, text: string, minor = false): LogEntry {
  return { id, tick: id, kind: 'instruction', text, minor };
}

describe('LogHudView', () => {
  it('menampilkan pesan kosong bila belum ada kejadian', () => {
    const html = renderToStaticMarkup(<LogHudView entries={[]} />);
    expect(html).toContain('Belum ada kejadian');
  });

  it('dapat dilipat: memakai <details> yang awalnya terbuka', () => {
    const html = renderToStaticMarkup(<LogHudView entries={[]} />);
    expect(html).toContain('<details');
    expect(html).toMatch(/<details[^>]*\sopen=""/);
    expect(html).toContain('Lipat');
    expect(html).toContain('Buka');
  });

  it('terbaru di atas', () => {
    const html = renderToStaticMarkup(
      <LogHudView
        entries={[entry(1, 'kejadian-lama'), entry(2, 'kejadian-baru')]}
      />,
    );
    expect(html.indexOf('kejadian-baru')).toBeLessThan(
      html.indexOf('kejadian-lama'),
    );
  });

  it('menyembunyikan perpindahan minor secara default', () => {
    const html = renderToStaticMarkup(
      <LogHudView
        entries={[entry(1, 'penting'), entry(2, 'rutin-scheduler', true)]}
      />,
    );
    expect(html).toContain('penting');
    expect(html).not.toContain('rutin-scheduler');
  });
});
