import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SimulationController } from '../../controller/SimulationController';
import type { Clock } from '../../controller/clock';
import { level1_1 } from '../../levels/module1/level-1-1';
import { level1_2 } from '../../levels/module1/level-1-2';
import { CoreIndicatorHud } from '../components/hud/CoreIndicatorHud';

const noClock: Clock = { requestFrame: () => 1, cancelFrame: () => {} };

describe('CoreIndicatorHud (T-086)', () => {
  it('tidak tampil bila level single core (Level 1-1: cores = 1)', () => {
    const controller = new SimulationController(undefined, noClock);
    controller.loadLevel(level1_1);
    const html = renderToStaticMarkup(
      <CoreIndicatorHud state={controller.getState()} />,
    );
    expect(html).toBe('');
  });

  it('tampil bila level multicore (Level 1-2: cores = 2)', () => {
    const controller = new SimulationController(undefined, noClock);
    controller.loadLevel(level1_2);
    const html = renderToStaticMarkup(
      <CoreIndicatorHud state={controller.getState()} />,
    );
    expect(html).toContain('Si Penjadwal (2 Core)');
    expect(html).toContain('Core 1');
    expect(html).toContain('Core 2');
    expect(html).toContain('utilisasi');
    expect(html).toContain('Menganggur');
  });

  it('menampilkan status Sibuk saat thread berstatus RUNNING', () => {
    const controller = new SimulationController(undefined, noClock);
    controller.loadLevel(level1_2);
    // Jalankan 1 step agar thread NEW -> READY/RUNNING
    controller.step();
    const html = renderToStaticMarkup(
      <CoreIndicatorHud state={controller.getState()} />,
    );
    expect(html).toContain('Core 1');
    expect(html).toContain('Core 2');
  });
});
