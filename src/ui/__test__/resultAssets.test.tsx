import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SimulationController } from '../../controller/SimulationController';
import type { PlacedTool } from '../../engine/tools';
import { level1_1 } from '../../levels/module1/level-1-1';
import { ResultDialog } from '../components/dialogs/ResultDialog';
import { RESULT_ASSETS, ribbonSrc } from '../resultAssets';

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

function render(
  controller: SimulationController,
  assets?: Parameters<typeof ResultDialog>[0]['assets'],
) {
  return renderToStaticMarkup(
    <ResultDialog
      controller={controller}
      state={controller.getState()}
      reduceMotion
      assets={assets}
    />,
  );
}

describe('RESULT_ASSETS', () => {
  it('semua berkas yang disebut ada di public/', () => {
    for (const path of Object.values(RESULT_ASSETS)) {
      if (path === null) continue;
      expect(existsSync(join(process.cwd(), 'public', path)), path).toBe(true);
    }
  });

  it('ribbonSrc memilih pita sesuai hasil', () => {
    expect(ribbonSrc(true)).toBe('assets/ui/ribbon-benar.png');
    expect(ribbonSrc(false)).toBe('assets/ui/ribbon-salah.png');
  });
});

describe('ResultDialog memakai gambar', () => {
  it('kalah: pita salah dan bintang kosong', () => {
    const html = render(finished(false));
    expect(html).toContain('assets/ui/ribbon-salah.png');
    expect(html).toContain('assets/ui/star-kosong.png');
    expect(html).not.toContain('assets/ui/star-penuh.png');
  });

  it('menang: pita benar dan bintang penuh', () => {
    const html = render(finished(true));
    expect(html).toContain('assets/ui/ribbon-benar.png');
    expect(html).toContain('assets/ui/star-penuh.png');
  });

  it('gambar hiasan tidak dibaca pembaca layar', () => {
    const html = render(finished(true));
    expect(html).toContain('alt=""');
    expect(html).toContain('Bagus! Sinkronisasi Berhasil!');
  });
});

describe('ResultDialog cadangan SVG bila gambar tidak ada', () => {
  const none = {
    ribbonSalah: null,
    ribbonBenar: null,
    starEmpty: null,
    starFull: null,
  };

  it('tidak memuat gambar dan tetap menampilkan judul', () => {
    const html = render(finished(false), none);
    expect(html).not.toContain('assets/ui/');
    expect(html).toContain('<polygon');
    expect(html).toContain('Waduh, Stok Salah!');
  });
});