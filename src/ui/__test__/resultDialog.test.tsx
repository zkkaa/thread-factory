import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SimulationController } from '../../controller/SimulationController';
import { level1_1 } from '../../levels/module1/level-1-1';
import { HintDialog } from '../components/dialogs/HintDialog';
import { ResultDialog } from '../components/dialogs/ResultDialog';
import { deriveResultView } from '../resultView';

const clock = { requestFrame: () => 1, cancelFrame: () => {} };

/** Jalankan level 1-1 tanpa mutex (seed tutorial) sampai selesai. */
function finishedWithoutMutex(): SimulationController {
  const controller = new SimulationController(undefined, clock);
  controller.loadLevel(level1_1);
  for (let i = 0; i < 5000; i++) {
    if (controller.getState().runState === 'finished') break;
    controller.step();
  }
  return controller;
}

describe('deriveResultView', () => {
  it('level 1-1 tanpa mutex: salah, judul dari data level, 3 kartu', () => {
    const { level, snapshot, result } = finishedWithoutMutex().getState();
    if (level === null || snapshot === null || result === null) {
      throw new Error('simulasi belum selesai');
    }
    const view = deriveResultView(level, snapshot, result);
    expect(view.ok).toBe(false);
    expect(view.title).toBe('Waduh, Stok Salah!');
    expect(view.quote.startsWith('Seharusnya 10, hasilnya')).toBe(true);
    expect(view.cards).toHaveLength(3);
    expect(view.criteria[0]?.met).toBe(false);
  });
});

describe('ResultDialog', () => {
  it('hasil salah: badge SALAH, Reset Simulasi, tanpa Petunjuk', () => {
    const controller = finishedWithoutMutex();
    const html = renderToStaticMarkup(
      <ResultDialog controller={controller} state={controller.getState()} />,
    );
    expect(html).toContain('SALAH');
    expect(html).toContain('Waduh, Stok Salah!');
    expect(html).toContain('Reset Simulasi');
    expect(html).not.toContain('Petunjuk');
  });

  it('menampilkan tombol Petunjuk bila ditawarkan', () => {
    const controller = finishedWithoutMutex();
    const html = renderToStaticMarkup(
      <ResultDialog
        controller={controller}
        state={controller.getState()}
        offerHint
        onHint={() => {}}
      />,
    );
    expect(html).toContain('Petunjuk');
  });

  it('tidak merender apa pun sebelum simulasi selesai', () => {
    const controller = new SimulationController(undefined, clock);
    controller.loadLevel(level1_1);
    const html = renderToStaticMarkup(
      <ResultDialog controller={controller} state={controller.getState()} />,
    );
    expect(html).toBe('');
  });
});

describe('HintDialog', () => {
  it('menampilkan petunjuk dan tombol berikutnya bila masih ada', () => {
    const html = renderToStaticMarkup(
      <HintDialog
        hints={['Coba pintu']}
        hasMore
        onMore={() => {}}
        onClose={() => {}}
      />,
    );
    expect(html).toContain('Coba pintu');
    expect(html).toContain('Petunjuk berikutnya');
  });

  it('tanpa petunjuk lanjutan: tombol berikutnya hilang', () => {
    const html = renderToStaticMarkup(
      <HintDialog
        hints={['x']}
        hasMore={false}
        onMore={() => {}}
        onClose={() => {}}
      />,
    );
    expect(html).not.toContain('Petunjuk berikutnya');
  });
});
