import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SimulationController } from '../../controller/SimulationController';
import type { ControllerState } from '../../controller/SimulationController';
import { level1_1 } from '../../levels/module1/level-1-1';
import { ControlHud } from '../components/hud/ControlHud';

function render(override: Partial<ControllerState> = {}): string {
  const controller = new SimulationController();
  controller.loadLevel(level1_1);
  const state = { ...controller.getState(), ...override };
  return renderToStaticMarkup(
    <ControlHud controller={controller} state={state} />,
  );
}

/** Mengambil tag <button> yang aria-label-nya sama persis. */
function buttonTag(html: string, label: string): string {
  const match = html.match(
    new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`),
  );
  if (match === null) throw new Error(`Tombol "${label}" tidak ditemukan`);
  return match[0];
}

const isDisabled = (tag: string) => tag.includes('disabled=""');

describe('ControlHud', () => {
  it('idle: semua tombol ikon punya aria-label dan aktif', () => {
    const html = render();
    for (const label of ['Jalankan', 'Step', 'Reset']) {
      expect(isDisabled(buttonTag(html, label))).toBe(false);
    }
    expect(html).toContain('Siap');
    expect(html).toContain('Seed 10');
    expect(html).toContain('aria-label="Kecepatan"');
  });

  it('running: tombol Jeda muncul, Jalankan hilang', () => {
    const html = render({ runState: 'running' });
    expect(html).toContain('aria-label="Jeda"');
    expect(html).not.toContain('aria-label="Jalankan"');
    expect(html).toContain('Berjalan');
  });

  it('paused: Jalankan dan Step aktif', () => {
    const html = render({ runState: 'paused' });
    expect(isDisabled(buttonTag(html, 'Jalankan'))).toBe(false);
    expect(isDisabled(buttonTag(html, 'Step'))).toBe(false);
    expect(html).toContain('Dijeda');
  });

  it('finished: Jalankan dan Step nonaktif', () => {
    const html = render({ runState: 'finished' });
    expect(isDisabled(buttonTag(html, 'Jalankan'))).toBe(true);
    expect(isDisabled(buttonTag(html, 'Step'))).toBe(true);
    expect(isDisabled(buttonTag(html, 'Reset'))).toBe(false);
    expect(html).toContain('Selesai');
  });

  it('error: Jalankan dan Step nonaktif, pesan error tampil', () => {
    const html = render({
      runState: 'paused',
      error: 'UNLOCK oleh non-pemilik.',
    });
    expect(isDisabled(buttonTag(html, 'Jalankan'))).toBe(true);
    expect(isDisabled(buttonTag(html, 'Step'))).toBe(true);
    expect(html).toContain('role="alert"');
    expect(html).toContain('UNLOCK oleh non-pemilik.');
    expect(html).toContain('Error');
  });

  it('menandai kecepatan aktif dengan aria-pressed', () => {
    const html = render({ speed: 5 });
    expect(html).toMatch(/aria-pressed="true"[^>]*>5x/);
    expect(html).toMatch(/aria-pressed="false"[^>]*>1x/);
  });

  it('menampilkan seed controller di chip', () => {
    const html = render({ seed: 42 });
    expect(html).toContain('Seed 42');
    expect(html).toContain('Ubah seed, sekarang 42');
  });
});
