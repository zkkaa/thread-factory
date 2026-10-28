import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SimulationController } from '../../controller/SimulationController';
import type { PlacedTool } from '../../engine/tools';
import { level1_1 } from '../../levels/module1/level-1-1';
import { ResultDialog } from '../components/dialogs/ResultDialog';
import { deriveResultView } from '../resultView';

const clock = { requestFrame: () => 1, cancelFrame: () => {} };

/** Mutex pas: menutupi READ sampai WRITE di kedua robot (loop bersama). */
const MUTEX_PAS: PlacedTool = {
  id: 'mutex:papan',
  kind: 'mutex',
  mutex: 'papan',
  spans: [
    { thread: 'A', start: 1, end: 3 },
    { thread: 'B', start: 1, end: 3 },
  ],
};

/** Level 1-1 dengan mutex pas pada `seed` (bawaan: seed tutorial), sampai selesai. */
function finishedWithMutex(seed?: number): SimulationController {
  const controller = new SimulationController(undefined, clock);
  controller.loadLevel(level1_1);
  if (seed !== undefined) controller.reset(seed);
  controller.placeTool(MUTEX_PAS);
  for (let i = 0; i < 5000; i++) {
    if (controller.getState().runState === 'finished') break;
    controller.step();
  }
  return controller;
}

function viewOf(controller: SimulationController) {
  const { level, snapshot, result } = controller.getState();
  if (level === null || snapshot === null || result === null) {
    throw new Error('simulasi belum selesai');
  }
  return deriveResultView(level, snapshot, result);
}

describe('hasil lulus (seed tutorial, mutex pas)', () => {
  const controller = finishedWithMutex();
  const view = viewOf(controller);

  it('benar, 3 bintang, tanpa catatan seed', () => {
    expect(view.ok).toBe(true);
    expect(view.stars).toBe(3);
    expect(view.seedNote).toBeNull();
    expect(view.criteria.every((c) => c.met)).toBe(true);
  });

  it('judul dari data level, kutipan sesuai target, tanpa pembaruan hilang', () => {
    expect(view.title).toBe(level1_1.resultTitle?.pass ?? 'Bagus! Berhasil!');
    expect(view.quote).toBe('Hasilnya 10, sesuai target 10.');
    expect(view.cards[0]).toEqual({ label: 'Pembaruan hilang', value: '0' });
  });

  it('penjelasan menyebut mutual exclusion', () => {
    expect(view.explanation).toContain('mutual exclusion');
  });

  it('dialog menampilkan BENAR dan kutipan hasil', () => {
    const html = renderToStaticMarkup(
      <ResultDialog
        controller={controller}
        state={controller.getState()}
        reduceMotion
      />,
    );
    expect(html).toContain('BENAR');
    expect(html).toContain('Hasilnya 10, sesuai target 10.');
    expect(html).not.toContain('SALAH');
  });
});

describe('hasil pada seed bukan tutorial', () => {
  const controller = finishedWithMutex(11);
  const view = viewOf(controller);

  it('lulus tetapi bintang tidak dinilai dan ada catatan seed', () => {
    expect(view.ok).toBe(true);
    expect(view.stars).toBeNull();
    expect(view.seedNote).toContain('seed tutorial (10)');
    expect(view.seedNote).toContain('Seed sekarang: 11');
  });

  it('dialog menampilkan catatan seed tutorial', () => {
    const html = renderToStaticMarkup(
      <ResultDialog
        controller={controller}
        state={controller.getState()}
        reduceMotion
      />,
    );
    expect(html).toContain('Bintang hanya dinilai pada seed tutorial (10)');
  });
});
