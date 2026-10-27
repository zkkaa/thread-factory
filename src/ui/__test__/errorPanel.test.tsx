import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ErrorPanel } from '../components/hud/ErrorPanel';

describe('ErrorPanel', () => {
  it('menampilkan pesan, role alert, dan tombol Reset', () => {
    const html = renderToStaticMarkup(
      <ErrorPanel message="Mutex tidak valid." onReset={() => {}} />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('Mutex tidak valid.');
    expect(html).toContain('Reset');
  });
});
