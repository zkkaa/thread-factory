import { describe, expect, it } from 'vitest';
import type { Instruction, ThreadDef } from '../../engine/types';
import type { LevelDefinition } from '../../levels/types';
import { SimulationController } from '../SimulationController';

function lockPair(first: string, second: string): Instruction[] {
  return [
    { op: 'LOCK', mutex: first },
    { op: 'LOCK', mutex: second },
    { op: 'WORK', ticks: 1 },
    { op: 'UNLOCK', mutex: second },
    { op: 'UNLOCK', mutex: first },
  ];
}

const thread = (id: string, program: Instruction[]): ThreadDef => ({
  id,
  label: id,
  program,
  repeat: 1,
});

const level: LevelDefinition = {
  id: 't-deadlock',
  module: 2,
  title: 'Uji pemulihan',
  intro: [{ text: 'uji' }],
  hints: ['a', 'b', 'c'],
  concepts: ['deadlock'],
  layoutId: 'tidak-ada',
  threads: [
    thread('A', lockPair('m1', 'm2')),
    thread('B', lockPair('m2', 'm3')),
    thread('C', lockPair('m3', 'm1')),
  ],
  sharedVars: { done: 0 },
  resources: [
    { kind: 'mutex', id: 'm1' },
    { kind: 'mutex', id: 'm2' },
    { kind: 'mutex', id: 'm3' },
  ],
  availableTools: [],
  scheduler: { kind: 'random', cores: 3 },
  recovery: 'manual',
  maxTicks: 200,
  goal: {
    target: { variable: 'done', value: 0 },
    invariant: () => ({ ok: true, message: 'ok' }),
    stars: { fast: 100, lowWait: 100 },
  },
};

function stalledController(): SimulationController {
  const controller = new SimulationController();
  controller.loadLevel(level, 1);
  for (let i = 0; i < 10; i += 1) {
    controller.step();
    if ((controller.getState().snapshot?.deadlock ?? null) !== null) break;
  }
  return controller;
}

describe('SimulationController: pemulihan deadlock (T-058)', () => {
  it('macet saat deadlock: paused, belum finished, tanpa result', () => {
    const state = stalledController().getState();

    expect(state.runState).toBe('paused');
    expect(state.snapshot?.deadlock).toEqual(['A', 'B', 'C']);
    expect(state.result).toBeNull();
    expect(state.events.some((e) => e.type === 'DEADLOCK_DETECTED')).toBe(true);
  });

  it('step() dan run() saat macet tidak mengubah state', () => {
    const controller = stalledController();
    const before = controller.getState();

    controller.step();
    controller.run();

    expect(controller.getState()).toBe(before);
  });

  it('preemptDeadlock() melepas macet, mencatat event, dan tetap paused', () => {
    const controller = stalledController();

    controller.preemptDeadlock();
    const state = controller.getState();

    expect(state.snapshot?.deadlock).toBeNull();
    expect(state.runState).toBe('paused');
    expect(state.error).toBeNull();
    expect(state.events.some((e) => e.type === 'LOCK_PREEMPTED')).toBe(true);
    expect(state.events.some((e) => e.type === 'THREAD_ROLLED_BACK')).toBe(true);
  });

  it('preemptDeadlock() tanpa deadlock tidak melakukan apa pun', () => {
    const controller = new SimulationController();
    controller.loadLevel(level, 1);
    const before = controller.getState();

    controller.preemptDeadlock();

    expect(controller.getState()).toBe(before);
  });

  it('korban tidak sah menjadi error controller, bukan exception', () => {
    const controller = stalledController();

    controller.preemptDeadlock('Z');

    expect(controller.getState().error).toMatch(/tidak ada di siklus/);
  });

  it('dengan pemulihan berulang, simulasi akhirnya selesai dan dinilai', () => {
    const controller = stalledController();

    for (let i = 0; i < 300; i += 1) {
      if (controller.getState().runState === 'finished') break;
      if ((controller.getState().snapshot?.deadlock ?? null) !== null) {
        controller.preemptDeadlock();
      }
      controller.step();
    }

    const state = controller.getState();
    expect(state.runState).toBe('finished');
    expect(state.result?.ok).toBe(true);
  });
});