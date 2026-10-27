import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SimulationController } from '../../controller/SimulationController';
import type { Clock } from '../../controller/clock';
import { level1_1 } from '../../levels/module1/level-1-1';
import { MetricsHud } from '../components/hud/MetricsHud';
import { deriveMetrics } from '../metricsView';

const noClock: Clock = { requestFrame: () => 1, cancelFrame: () => {} };

function makeController(): SimulationController {
  const controller = new SimulationController(undefined, noClock);
  controller.loadLevel(level1_1);
  return controller;
}

describe('deriveMetrics', () => {
  it('sebelum selesai: hasil penilaian belum ada', () => {
    const view = deriveMetrics(makeController().getState());
    expect(view?.target).toBe(10);
    expect(view?.lostUpdates).toBe('-');
    expect(view?.throughput).toBe('-');
    expect(view?.threads).toHaveLength(2);
  });

  it('setelah selesai: pembaruan hilang dan throughput terisi', () => {
    const controller = makeController();
    for (
      let i = 0;
      i < 200 && controller.getState().runState !== 'finished';
      i++
    )
      controller.step();
    const view = deriveMetrics(controller.getState());
    expect(view?.lostUpdates).not.toBe('-');
    expect(view?.throughput).toContain('pekerjaan/tick');
  });
});

describe('MetricsHud', () => {
  it('tertutup secara default dan memuat ringkasan di judul', () => {
    const html = renderToStaticMarkup(
      <MetricsHud state={makeController().getState()} />,
    );
    expect(html).toContain('<details');
    expect(html).not.toMatch(/<details[^>]*\sopen=""/);
    expect(html).toContain('/ 10');
  });

  it('menampilkan waktu tunggu tiap robot', () => {
    const html = renderToStaticMarkup(
      <MetricsHud state={makeController().getState()} />,
    );
    expect(html).toContain('Tunggu');
    expect(html).toContain('tick');
  });
});
