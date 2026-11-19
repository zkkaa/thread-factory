import type { Dispatch, ReactElement, ReactNode, SetStateAction } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useState: <S,>(initial: S): [S, Dispatch<SetStateAction<S>>] => [
      initial,
      () => undefined,
    ],
  };
});

import { isValidElement } from 'react';
import { buildEngineConfig } from '../../controller/buildEngineConfig';
import type { Clock } from '../../controller/clock';
import { SimulationController } from '../../controller/SimulationController';
import { LEVEL_2_3_THREADS } from '../../levels/module2/level-2-3.scenario';
import { level2_4 } from '../../levels/module2/level-2-4';
import { buildBeltTool, findBeltSetup } from '../beltTool';
import { RwToolbox } from '../components/hud/RwToolbox';

const noClock: Clock = { requestFrame: () => 1, cancelFrame: () => {} };

type ButtonProps = {
  children?: ReactNode;
  onClick?: () => void;
};

function findButtons(node: ReactNode): ReactElement<ButtonProps>[] {
  if (Array.isArray(node)) return node.flatMap(findButtons);
  if (!isValidElement<ButtonProps>(node)) return [];
  const current = node.type === 'button' ? [node] : [];
  return [...current, ...findButtons(node.props.children)];
}

describe('RwToolbox', () => {
  it('memasang rwlock saat kebijakan Adil dipilih', () => {
    const controller = new SimulationController(undefined, noClock);
    controller.loadLevel(level2_4);
    const belt = findBeltSetup(level2_4);
    if (belt === null) throw new Error('Setup ban tidak ditemukan.');
    controller.placeTool(buildBeltTool(belt, 'slot'));
    controller.placeTool(buildBeltTool(belt, 'item'));
    controller.placeTool({
      id: 'semaphore:kursi',
      kind: 'semaphore',
      sem: 'kursi',
      value: 4,
      spans: LEVEL_2_3_THREADS.map((thread) => ({
        thread: thread.id,
        start: 0,
        end: 4,
      })),
    });

    const tree = RwToolbox({ controller, state: controller.getState() });
    const fairButton = findButtons(tree).find(
      (button) => button.props.children === 'Adil (FIFO)',
    );
    expect(fairButton).toBeDefined();
    fairButton?.props.onClick?.();

    const installed = controller
      .getState()
      .tools.find((tool) => tool.kind === 'rwlock');
    expect(installed?.kind).toBe('rwlock');
    if (installed?.kind !== 'rwlock') {
      throw new Error('Pengaman papan belum terpasang.');
    }
    expect(controller.getState().tools).toHaveLength(4);
    expect(installed.policy).toBe('fair');

    const config = buildEngineConfig(level2_4, controller.getState().tools);
    expect(config.rwLocks?.['kunci-papan']).toBe('fair');
    expect(
      config.threads
        .find((thread) => thread.id === 'R1')
        ?.program.some((instruction) => instruction.op === 'RW_ACQUIRE_READ'),
    ).toBe(true);
  });
});
