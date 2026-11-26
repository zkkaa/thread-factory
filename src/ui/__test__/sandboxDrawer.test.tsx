import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { defaultSandboxValues, sandboxParamsFor } from '../../levels/sandbox';
import { SandboxDrawer } from '../components/hud/SandboxDrawer';
import { limitLabel } from '../limitLabel';

const LEVEL = '1-1';
const noop = () => undefined;

function render(error: string | null) {
  return renderToStaticMarkup(
    <SandboxDrawer
      levelId={LEVEL}
      values={defaultSandboxValues(LEVEL)}
      error={error}
      onChange={noop}
      onReset={noop}
    />,
  );
}

describe('SandboxDrawer', () => {
  it('terbuka secara default dengan tombol Lipat dan tombol reset', () => {
    const html = render(null);
    expect(html).toContain('aria-label="Parameter Sandbox"');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('Lipat');
    expect(html).toContain('Kembalikan nilai awal');
  });

  it('tiap parameter angka punya tombol Kurangi dan Tambah ber-aria-label', () => {
    const html = render(null);
    const numbers = sandboxParamsFor(LEVEL).filter(
      (def) => def.kind === 'number',
    );
    expect(numbers.length).toBeGreaterThan(0);
    for (const def of numbers) {
      expect(html).toContain(`aria-label="Kurangi ${def.label}"`);
      expect(html).toContain(`aria-label="Tambah ${def.label}"`);
    }
  });

  it('pesan error tampil sebagai alert, dan tidak ada alert tanpa error', () => {
    expect(render('Batas terlampaui')).toContain('role="alert"');
    expect(render('Batas terlampaui')).toContain('Batas terlampaui');
    expect(render(null)).not.toContain('role="alert"');
  });
});

describe('limitLabel', () => {
  it('memberi MIN di batas bawah dan MAKS di batas atas', () => {
    expect(limitLabel(1, 1, 5)).toBe('MIN');
    expect(limitLabel(5, 1, 5)).toBe('MAKS');
  });

  it('kosong di antara batas', () => {
    expect(limitLabel(3, 1, 5)).toBe('');
  });
});
