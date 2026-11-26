import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BootScreen } from '../screens/BootScreen';

describe('BootScreen', () => {
  it('menampilkan progressbar dengan persentase', () => {
    const html = renderToStaticMarkup(
      <BootScreen progress={{ done: 1, total: 2 }} />,
    );
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="50"');
    expect(html).toContain('50%');
    expect(html).toContain('Memuat aset');
  });

  it('daftar kosong dianggap selesai (100%)', () => {
    const html = renderToStaticMarkup(
      <BootScreen progress={{ done: 0, total: 0 }} />,
    );
    expect(html).toContain('aria-valuenow="100"');
  });
});
