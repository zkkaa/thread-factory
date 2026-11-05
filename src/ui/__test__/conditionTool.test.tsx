import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SimulationController } from '../../controller/SimulationController';
import { level1_3 } from '../../levels/module1/level-1-3';
import { level1_4 } from '../../levels/module1/level-1-4';
import { ConditionToolbox } from '../components/hud/ConditionToolbox';
import {
  buildConditionTool,
  conditionToolId,
  findConditionSetup,
  readConditionSlot,
} from '../conditionTool';
import { replaceTool } from '../toolSpans';

describe('conditionTool (T-091)', () => {
  it('membaca penunggu dan pemberi sinyal dari data level 1-4', () => {
    const setup = findConditionSetup(level1_4);
    expect(setup).toEqual({
      condId: 'lampu',
      mutexId: 'meja',
      waiter: { thread: 'P', index: 0 },
      signalerId: 'A',
      signalerOps: ['WORK', 'READ', 'COMPUTE', 'WRITE'],
    });
  });

  it('level tanpa condition atau SPIN_UNTIL menghasilkan null', () => {
    expect(findConditionSetup(level1_3)).toBeNull();
  });

  it('buildConditionTool: slot null melepas, slot angka membangun alat', () => {
    const setup = findConditionSetup(level1_4);
    if (setup === null) throw new Error('setup null');
    expect(buildConditionTool(setup, null)).toBeNull();
    const tool = buildConditionTool(setup, 4);
    expect(tool?.id).toBe(conditionToolId('lampu'));
    expect(readConditionSlot(tool)).toBe(4);
    expect(readConditionSlot(null)).toBeNull();
  });
});

describe('ConditionToolbox (T-091)', () => {
  function loaded() {
    const controller = new SimulationController();
    controller.loadLevel(level1_4);
    return controller;
  }

  it('idle: slot punya aria-label dan tidak disabled', () => {
    const controller = loaded();
    const html = renderToStaticMarkup(
      <ConditionToolbox
        controller={controller}
        state={controller.getState()}
      />,
    );
    expect(html).toMatch(/aria-label="Slot 4, sesudah WRITE"/);
    expect(html).toMatch(/belum dipasang/);
    expect(html).not.toMatch(/Alat terkunci/);
  });

  it('setelah alat dipasang: slot terpilih ditandai', () => {
    const controller = loaded();
    const setup = findConditionSetup(level1_4);
    if (setup === null) throw new Error('setup null');
    const error = replaceTool(
      controller,
      conditionToolId('lampu'),
      buildConditionTool(setup, 4),
    );
    expect(error).toBeNull();
    const html = renderToStaticMarkup(
      <ConditionToolbox
        controller={controller}
        state={controller.getState()}
      />,
    );
    expect(html).toMatch(/lampu dinyalakan di slot 4/);
    expect(html).toMatch(/lampu dinyalakan di sini/);
  });

  it('setelah simulasi dimulai: terkunci dan tombol disabled', () => {
    const controller = loaded();
    controller.step();
    const html = renderToStaticMarkup(
      <ConditionToolbox
        controller={controller}
        state={controller.getState()}
      />,
    );
    expect(html).toMatch(/Alat terkunci/);
    expect(html).toMatch(/disabled/);
  });
});
