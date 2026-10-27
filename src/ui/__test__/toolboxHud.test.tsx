import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SimulationController } from '../../controller/SimulationController';
import type { Clock } from '../../controller/clock';
import type { PlacedTool } from '../../engine/tools';
import { level1_1 } from '../../levels/module1/level-1-1';
import { ToolboxHud } from '../components/hud/ToolboxHud';

const noClock: Clock = { requestFrame: () => 1, cancelFrame: () => {} };

const MUTEX_PAS: PlacedTool = {
  id: 'mutex:papan',
  kind: 'mutex',
  mutex: 'papan',
  spans: [
    { thread: 'A', start: 1, end: 3 },
    { thread: 'B', start: 1, end: 3 },
  ],
};

function makeController(): SimulationController {
  const controller = new SimulationController(undefined, noClock);
  controller.loadLevel(level1_1);
  return controller;
}

function render(controller: SimulationController): string {
  return renderToStaticMarkup(
    <ToolboxHud controller={controller} state={controller.getState()} />,
  );
}

/** Tag tombol "Hapus" punya atribut disabled sungguhan. */
function hapusDisabled(html: string): boolean {
  const tag = /<button[^>]*>Hapus<\/button>/.exec(html)?.[0] ?? '';
  return /\sdisabled=""/.test(tag);
}

describe('ToolboxHud', () => {
  it('awalnya pintu belum dipasang dan Hapus nonaktif', () => {
    const html = render(makeController());
    expect(html).toContain('Pintu Mutex (belum dipasang)');
    expect(hapusDisabled(html)).toBe(true);
  });

  it('menampilkan posisi pintu yang terpasang dan Hapus aktif', () => {
    const controller = makeController();
    controller.placeTool(MUTEX_PAS);
    const html = render(controller);
    expect(html).toContain('masuk slot 1, keluar slot 4');
    expect(hapusDisabled(html)).toBe(false);
  });

  it('terkunci setelah simulasi dimulai', () => {
    const controller = makeController();
    controller.placeTool(MUTEX_PAS);
    controller.step();
    const html = render(controller);
    expect(html).toContain('Alat terkunci');
    expect(hapusDisabled(html)).toBe(true);
  });

  it('tidak tampil bila level tidak punya alat mutex', () => {
    const controller = makeController();
    const state = controller.getState();
    if (state.level === null) throw new Error('level belum dimuat');
    const html = renderToStaticMarkup(
      <ToolboxHud
        controller={controller}
        state={{ ...state, level: { ...state.level, availableTools: [] } }}
      />,
    );
    expect(html).toBe('');
  });
});
