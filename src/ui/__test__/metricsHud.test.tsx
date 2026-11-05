import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SimulationController } from '../../controller/SimulationController';
import type { Clock } from '../../controller/clock';
import { level1_1 } from '../../levels/module1/level-1-1';
import { level1_2 } from '../../levels/module1/level-1-2';
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

  it('menampilkan utilisasi core bila level multicore (cores > 1)', () => {
    const controller = new SimulationController(undefined, noClock);
    controller.loadLevel(level1_2);
    const html = renderToStaticMarkup(
      <MetricsHud state={controller.getState()} />,
    );
    expect(html).toContain('Utilisasi core');
  });
});

describe('Metrik busy waiting (T-045)', () => {
  /** Level 1-1 ditambah satu pengepak yang berputar menunggu stok >= 10. */
  const levelWithSpinner = {
    ...level1_1,
    threads: [
      ...level1_1.threads,
      {
        id: 'P',
        label: 'Pengepak',
        program: [
          {
            op: 'SPIN_UNTIL' as const,
            variable: level1_1.goal.target.variable,
            atLeast: level1_1.goal.target.value,
          },
          { op: 'WORK' as const, ticks: 1 },
        ],
      },
    ],
  };

  function spinnerController(): SimulationController {
    const controller = new SimulationController(undefined, noClock);
    controller.loadLevel(levelWithSpinner);
    return controller;
  }

  it('level tanpa SPIN_UNTIL: busyWait bernilai null dan HUD tidak menampilkannya', () => {
    const state = makeController().getState();
    expect(deriveMetrics(state)?.busyWait).toBeNull();
    expect(renderToStaticMarkup(<MetricsHud state={state} />)).not.toContain(
      'busy waiting',
    );
  });

  it('level dengan SPIN_UNTIL: baterai penuh di awal', () => {
    const view = deriveMetrics(spinnerController().getState());
    expect(view?.busyWait?.totalTicks).toBe(0);
    expect(view?.busyWait?.robots).toEqual([
      { id: 'P', label: 'Pengepak', ticks: 0, battery: '100%' },
    ]);
  });

  it('baterai pengepak berkurang seiring tick busy waiting', () => {
    const controller = spinnerController();
    for (let i = 0; i < 30; i++) controller.step();
    const view = deriveMetrics(controller.getState());
    const robot = view?.busyWait?.robots[0];
    expect(robot?.ticks).toBeGreaterThan(0);
    expect(robot?.battery).not.toBe('100%');
    // Robot yang tidak berputar tidak ikut tampil di daftar baterai.
    expect(view?.busyWait?.robots).toHaveLength(1);
  });

  it('HUD menampilkan tick busy waiting dan baterai pengepak', () => {
    const controller = spinnerController();
    for (let i = 0; i < 5; i++) controller.step();
    const html = renderToStaticMarkup(
      <MetricsHud state={controller.getState()} />,
    );
    expect(html).toContain('Tick busy waiting');
    expect(html).toContain('Baterai Pengepak');
  });
});
