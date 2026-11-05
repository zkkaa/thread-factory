import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SimulationController } from '../../controller/SimulationController';
import type { Clock } from '../../controller/clock';
import { level1_3 } from '../../levels/module1/level-1-3';
import { GateDragChip } from '../components/hud/GateDragChip';
import { ToolboxHud } from '../components/hud/ToolboxHud';

const noClock: Clock = { requestFrame: () => 1, cancelFrame: () => {} };

function renderToolbox(controller: SimulationController): string {
  return renderToStaticMarkup(
    <ToolboxHud controller={controller} state={controller.getState()} />,
  );
}

describe('GateDragChip (T-042)', () => {
  it('dapat diseret saat alat belum terkunci', () => {
    const html = renderToStaticMarkup(<GateDragChip editable />);
    expect(html).toContain('Seret Kartu Akses');
    expect(html).toContain('draggable="true"');
  });

  it('tidak dapat diseret saat terkunci', () => {
    const html = renderToStaticMarkup(<GateDragChip editable={false} />);
    expect(html).toContain('draggable="false"');
  });

  it('muncul di toolbox Level 1-3 dan terkunci setelah simulasi dimulai', () => {
    const controller = new SimulationController(undefined, noClock);
    controller.loadLevel(level1_3);
    const idle = renderToolbox(controller);
    expect(idle).toContain('Seret Kartu Akses');
    expect(idle).toContain('draggable="true"');

    controller.step();
    expect(renderToolbox(controller)).toContain('draggable="false"');
  });
});
