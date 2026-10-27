import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PauseMenu } from '../components/hud/PauseMenu';

const noop = (): void => {};

describe('PauseMenu', () => {
  const html = renderToStaticMarkup(
    <PauseMenu
      onResume={noop}
      onRestart={noop}
      onMap={noop}
      onSettings={noop}
    />,
  );

  it('memuat empat pilihan', () => {
    for (const label of ['Lanjut', 'Ulangi Level', 'Peta Level', 'Pengaturan'])
      expect(html).toContain(`>${label}</button>`);
  });

  it('berupa dialog modal berlabel', () => {
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-label="Menu Jeda"');
  });
});
