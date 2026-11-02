import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SimulationController } from '../../controller/SimulationController';
import type { PlacedTool } from '../../engine/tools';
import { level1_1 } from '../../levels/module1/level-1-1';
import { ResultDialog } from '../components/dialogs/ResultDialog';
import { deriveResultView } from '../resultView';

const clock = { requestFrame: () => 1, cancelFrame: () => {} };

const MUTEX_PAS: PlacedTool = {
  id: 'mutex:papan',
  kind: 'mutex',
  mutex: 'papan',
  spans: [
    { thread: 'A', start: 1, end: 3 },
    { thread: 'B', start: 1, end: 3 },
  ],
};

/** Level 1-1 pada seed tutorial sampai selesai; dengan atau tanpa mutex pas. */
function finished(withMutex: boolean): SimulationController {
  const controller = new SimulationController(undefined, clock);
  controller.loadLevel(level1_1);
  if (withMutex) controller.placeTool(MUTEX_PAS);
  for (let i = 0; i < 5000; i++) {
    if (controller.getState().runState === 'finished') break;
    controller.step();
  }
  return controller;
}

function render(controller: SimulationController, reduceMotion = false) {
  return renderToStaticMarkup(
    <ResultDialog
      controller={controller}
      state={controller.getState()}
      reduceMotion={reduceMotion}
    />,
  );
}

describe('keyFigure', () => {
  it('kalah: angka akhir tidak sama dengan target', () => {
    const { level, snapshot, result } = finished(false).getState();
    if (level === null || snapshot === null || result === null) {
      throw new Error('simulasi belum selesai');
    }
    const fig = deriveResultView(level, snapshot, result).keyFigure;
    expect(fig.label).toBe('Stok');
    expect(fig.target).toBe('10');
    expect(fig.match).toBe(false);
  });

  it('menang: angka akhir sama dengan target', () => {
    const { level, snapshot, result } = finished(true).getState();
    if (level === null || snapshot === null || result === null) {
      throw new Error('simulasi belum selesai');
    }
    const fig = deriveResultView(level, snapshot, result).keyFigure;
    expect(fig.actual).toBe('10');
    expect(fig.match).toBe(true);
  });
});

describe('ResultDialog gaya komik: kalah', () => {
  const controller = finished(false);

  it('bar angka kunci memakai simbol ≠ dan teks', () => {
    const html = render(controller);
    expect(html).toContain('Stok:');
    expect(html).toMatch(/\d+ ≠ 10/);
    expect(html).toContain('tidak sesuai target');
  });

  it('lencana SALAH tidak tampil, tetapi tersedia untuk pembaca layar', () => {
    const html = render(controller);
    expect(html).toContain('Waduh, Stok Salah!');
    expect(html).toContain('sr-only">Hasil: SALAH');
    expect(html).not.toContain('✕ </span>SALAH');
  });

  it('kartu angka tidak tampil di popup', () => {
    const html = render(controller);
    expect(html).not.toContain('Total tick');
    expect(html).not.toContain('Pembaruan hilang');
  });

  it('penjelasan tertutup secara bawaan', () => {
    const html = render(controller);
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('Kenapa begini?');
    expect(html).not.toContain('race condition');
  });

  it('efek: pita bergetar dan tepi kemerahan, tanpa konfeti', () => {
    const html = render(controller);
    expect(html).toContain('data-effect="shake"');
    expect(html).toContain('data-effect="vignette"');
    expect(html).not.toContain('data-effect="confetti"');
  });

  it('kurangi animasi mematikan semua efek', () => {
    expect(render(controller, true)).not.toContain('data-effect');
  });

  it('dialog modal berlabel, tombol berlabel teks', () => {
    const html = render(controller);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby="result-title"');
    expect(html).toContain('Reset Simulasi');
    expect(html).toContain('Tutup');
  });
});

describe('ResultDialog gaya komik: menang', () => {
  const controller = finished(true);

  it('bar angka kunci memakai simbol =', () => {
    const html = render(controller);
    expect(html).toMatch(/10 = 10/);
    expect(html).toContain('sesuai target');
  });

  it('bintang tampil dengan label tersedia untuk pembaca layar', () => {
    const html = render(controller, true);
    expect(html).toContain('aria-label="3 dari 3 bintang"');
  });

  it('penjelasan tertutup secara bawaan', () => {
    const html = render(controller);
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('mutual exclusion');
  });

  it('efek: konfeti, tanpa getar dan tepi kemerahan', () => {
    const html = render(controller);
    expect(html).toContain('data-effect="confetti"');
    expect(html).not.toContain('data-effect="shake"');
    expect(html).not.toContain('data-effect="vignette"');
  });

  it('kurangi animasi mematikan semua efek', () => {
    expect(render(controller, true)).not.toContain('data-effect');
  });

  it('hasil BENAR hanya untuk pembaca layar, tanpa penanda SALAH', () => {
    const html = render(controller, true);
    expect(html).toContain('sr-only">Hasil: BENAR');
    expect(html).not.toContain('SALAH');
  });
});
