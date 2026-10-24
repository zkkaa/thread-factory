import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SimulationController } from '../../controller/SimulationController';
import type { Clock } from '../../controller/clock';
import { Engine } from '../../engine/engine';
import type { PlacedTool } from '../../engine/tools';
import type { StepResult } from '../../engine/types';
import { level1_1 } from '../../levels/module1/level-1-1';
import { ControlBar } from '../components/ControlBar';
import { MetricsPanel } from '../components/MetricsPanel';
import { ResultDialog } from '../components/ResultDialog';
import { Toolbox } from '../components/Toolbox';

const noClock: Clock = { requestFrame: () => 1, cancelFrame: () => {} };

class ThrowingEngine extends Engine {
  override step(): StepResult {
    throw new Error('boom');
  }
}

const MUTEX_PAS: PlacedTool = {
  id: 'mutex:papan',
  kind: 'mutex',
  mutex: 'papan',
  spans: [
    { thread: 'A', start: 1, end: 3 },
    { thread: 'B', start: 1, end: 3 },
  ],
};

function makeController(engine: Engine = new Engine()): SimulationController {
  const controller = new SimulationController(engine, noClock);
  controller.loadLevel(level1_1);
  return controller;
}

function finish(controller: SimulationController): void {
  for (let i = 0; i < 200 && controller.getState().runState !== 'finished'; i++) controller.step();
}

/** Mengambil tag <button> yang isinya persis `label`. */
function buttonTag(html: string, label: string): string {
  const match = new RegExp(`<button[^>]*>${label}</button>`).exec(html);
  if (match === null) throw new Error(`tombol "${label}" tidak ditemukan`);
  return match[0];
}

/** Tag memiliki atribut disabled sungguhan (bukan sekadar kelas Tailwind `disabled:...`). */
function isDisabled(tag: string): boolean {
  return /\sdisabled=""/.test(tag);
}

/** Semua tag <button> ubin di Toolbox (dikenali dari aria-label "Robot ..."). */
function tileTags(html: string): string[] {
  return html.match(/<button[^>]*aria-label="Robot[^>]*>/g) ?? [];
}

describe('ControlBar', () => {
  it('saat idle: Run, Step, Reset aktif; kecepatan dan seed tutorial tampil', () => {
    const controller = makeController();
    const html = renderToStaticMarkup(<ControlBar controller={controller} state={controller.getState()} />);
    for (const label of ['Run', 'Step', 'Reset']) {
      expect(isDisabled(buttonTag(html, label))).toBe(false);
    }
    expect(html).toContain('0.5x');
    expect(html).toContain('5x');
    expect(html).toContain('Seed tutorial (10)');
    expect(html).toContain('value="10"');
    expect(html).toContain('Siap');
  });

  it('setelah error engine: pesan tampil dan Run/Step nonaktif sampai Reset', () => {
    const controller = makeController(new ThrowingEngine());
    controller.step();
    const html = renderToStaticMarkup(<ControlBar controller={controller} state={controller.getState()} />);
    expect(html).toContain('role="alert"');
    expect(html).toContain('boom');
    expect(isDisabled(buttonTag(html, 'Run'))).toBe(true);
    expect(isDisabled(buttonTag(html, 'Step'))).toBe(true);
    expect(isDisabled(buttonTag(html, 'Reset'))).toBe(false);
  });

  it('saat selesai: Run dan Step nonaktif dan ada petunjuk Reset', () => {
    const controller = makeController();
    finish(controller);
    const html = renderToStaticMarkup(<ControlBar controller={controller} state={controller.getState()} />);
    expect(isDisabled(buttonTag(html, 'Run'))).toBe(true);
    expect(isDisabled(buttonTag(html, 'Step'))).toBe(true);
    expect(html).toContain('Selesai');
    expect(html).toContain('Tekan Reset untuk mengulang');
  });
});

describe('Toolbox', () => {
  it('menggambar ubin program asli tiap robot (4 ubin x 2 robot)', () => {
    const controller = makeController();
    const html = renderToStaticMarkup(<Toolbox controller={controller} state={controller.getState()} />);
    expect(html).toContain('Pintu Papan Stok');
    expect(html.match(/aria-label="Robot [AB], ubin \d, /g)).toHaveLength(8);
    expect(tileTags(html).filter(isDisabled)).toHaveLength(0); // idle: semua ubin bisa diklik
    expect(html).toContain('WORK');
    expect(html).toContain('WRITE');
  });

  it('ubin yang tertutup mutex diberi tanda teks (bukan hanya warna)', () => {
    const controller = makeController();
    controller.placeTool(MUTEX_PAS);
    const html = renderToStaticMarkup(<Toolbox controller={controller} state={controller.getState()} />);
    expect(html.match(/tertutup pintu mutex/g)).toHaveLength(6); // ubin 2-4 pada dua robot
    expect(html).toContain('Lepas pintu');
  });

  it('setelah simulasi dimulai: ubin nonaktif dan ada penjelasan terkunci', () => {
    const controller = makeController();
    controller.step();
    const html = renderToStaticMarkup(<Toolbox controller={controller} state={controller.getState()} />);
    expect(html).toContain('Alat terkunci');
    expect(html).not.toContain('Lepas pintu');
    const tiles = tileTags(html);
    expect(tiles).toHaveLength(8);
    expect(tiles.filter(isDisabled)).toHaveLength(8);
  });
});

describe('MetricsPanel', () => {
  it('sebelum selesai: nilai saat ini, tanda "-" untuk metrik akhir', () => {
    const controller = makeController();
    const html = renderToStaticMarkup(<MetricsPanel state={controller.getState()} />);
    expect(html).toContain('Nilai stok');
    expect(html).toContain('target 10');
    expect(html).toContain('Waktu tunggu Robot A');
    expect(html).toContain('Waktu tunggu Robot B');
    expect(html).toContain('<dd>-</dd>');
  });

  it('setelah selesai tanpa mutex: pembaruan hilang 2', () => {
    const controller = makeController();
    finish(controller);
    const html = renderToStaticMarkup(<MetricsPanel state={controller.getState()} />);
    expect(html).toContain('<strong>8</strong>');
    expect(html).toContain('<dd>2</dd>');
  });
});

describe('ResultDialog', () => {
  it('tidak tampil sebelum simulasi selesai', () => {
    const controller = makeController();
    expect(renderToStaticMarkup(<ResultDialog controller={controller} state={controller.getState()} />)).toBe('');
  });

  it('gagal: "Seharusnya 10, hasilnya 8", SALAH, penjelasan race condition', () => {
    const controller = makeController();
    finish(controller);
    const html = renderToStaticMarkup(<ResultDialog controller={controller} state={controller.getState()} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('Seharusnya 10, hasilnya 8');
    expect(html).toContain('SALAH');
    expect(html).toContain('race condition');
    expect(html).toContain('aria-label="0 dari 3 bintang"');
  });

  it('lulus dengan mutex pas: BENAR, 3 bintang, penjelasan mutual exclusion', () => {
    const controller = makeController();
    controller.placeTool(MUTEX_PAS);
    finish(controller);
    const html = renderToStaticMarkup(<ResultDialog controller={controller} state={controller.getState()} />);
    expect(html).toContain('Seharusnya 10, hasilnya 10');
    expect(html).toContain('BENAR');
    expect(html).toContain('aria-label="3 dari 3 bintang"');
    expect(html).toContain('mutual exclusion');
  });

  it('seed bukan tutorial: catatan bahwa bintang tidak dinilai', () => {
    const controller = makeController();
    controller.reset(11);
    controller.placeTool(MUTEX_PAS);
    finish(controller);
    const html = renderToStaticMarkup(<ResultDialog controller={controller} state={controller.getState()} />);
    expect(html).toContain('Bintang hanya dinilai pada seed tutorial (10)');
    expect(html).not.toContain('dari 3 bintang');
  });
});
