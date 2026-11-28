import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CollapsiblePanel } from '../components/hud/CollapsiblePanel';

describe('CollapsiblePanel', () => {
  it('terbuka bawaan: isi tampil dan tombol berstatus expanded', () => {
    const html = renderToStaticMarkup(
      <CollapsiblePanel title="Level 1-3">
        <p>isi panel</p>
      </CollapsiblePanel>,
    );
    expect(html).toContain('Level 1-3');
    expect(html).toContain('isi panel');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('Lipat');
  });

  it('defaultOpen false: hanya kepala yang tampil', () => {
    const html = renderToStaticMarkup(
      <CollapsiblePanel title="Level 1-3" defaultOpen={false}>
        <p>isi panel</p>
      </CollapsiblePanel>,
    );
    expect(html).toContain('Level 1-3');
    expect(html).not.toContain('isi panel');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('Buka');
  });
});