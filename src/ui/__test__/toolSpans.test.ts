import { describe, it, expect } from 'vitest';
import { SimulationController } from '../../controller/SimulationController';
import type { Clock } from '../../controller/clock';
import { Engine } from '../../engine/engine';
import type { PlacedTool } from '../../engine/tools';
import { level1_1 } from '../../levels/module1/level-1-1';
import {
  buildMutexTool,
  findSpan,
  isCovered,
  mutexToolId,
  replaceTool,
} from '../toolSpans';

const noClock: Clock = { requestFrame: () => 1, cancelFrame: () => {} };

function makeController(): SimulationController {
  const controller = new SimulationController(new Engine(), noClock);
  controller.loadLevel(level1_1);
  return controller;
}

describe('buildMutexTool', () => {
  it('membuat alat baru dari rentang pertama', () => {
    const tool = buildMutexTool(null, 'papan', 'A', {
      thread: 'A',
      start: 1,
      end: 3,
    });
    expect(tool).toEqual({
      id: 'mutex:papan',
      kind: 'mutex',
      mutex: 'papan',
      spans: [{ thread: 'A', start: 1, end: 3 }],
    });
  });

  it('menambah rentang robot lain tanpa mengubah yang sudah ada', () => {
    const first = buildMutexTool(null, 'papan', 'A', {
      thread: 'A',
      start: 1,
      end: 3,
    });
    const both = buildMutexTool(first, 'papan', 'B', {
      thread: 'B',
      start: 2,
      end: 3,
    });
    expect(both?.spans).toEqual([
      { thread: 'A', start: 1, end: 3 },
      { thread: 'B', start: 2, end: 3 },
    ]);
  });

  it('mengganti rentang robot yang sama (tetap satu rentang per robot)', () => {
    const first = buildMutexTool(null, 'papan', 'A', {
      thread: 'A',
      start: 1,
      end: 3,
    });
    const next = buildMutexTool(first, 'papan', 'A', {
      thread: 'A',
      start: 0,
      end: 3,
    });
    expect(next?.spans).toEqual([{ thread: 'A', start: 0, end: 3 }]);
  });

  it('melepas rentang terakhir menghasilkan null; masukan tidak berubah', () => {
    const first = buildMutexTool(null, 'papan', 'A', {
      thread: 'A',
      start: 1,
      end: 3,
    }) as PlacedTool;
    const copy = JSON.stringify(first);
    expect(buildMutexTool(first, 'papan', 'A', null)).toBeNull();
    expect(JSON.stringify(first)).toBe(copy);
  });
});

describe('findSpan dan isCovered', () => {
  const tool = buildMutexTool(null, 'papan', 'A', {
    thread: 'A',
    start: 1,
    end: 3,
  });

  it('findSpan mencari per robot', () => {
    expect(findSpan(tool, 'A')).toEqual({ thread: 'A', start: 1, end: 3 });
    expect(findSpan(tool, 'B')).toBeUndefined();
    expect(findSpan(null, 'A')).toBeUndefined();
  });

  it('isCovered memakai batas inklusif', () => {
    const span = findSpan(tool, 'A');
    expect([0, 1, 2, 3].map((i) => isCovered(span, i))).toEqual([
      false,
      true,
      true,
      true,
    ]);
    expect(isCovered(undefined, 1)).toBe(false);
  });
});

describe('replaceTool dengan controller sungguhan', () => {
  const id = mutexToolId('papan');

  it('memasang, mengganti, dan melepas alat', () => {
    const controller = makeController();
    const a = buildMutexTool(null, 'papan', 'A', {
      thread: 'A',
      start: 1,
      end: 3,
    });
    expect(replaceTool(controller, id, a)).toBeNull();
    expect(controller.getState().tools).toHaveLength(1);

    const ab = buildMutexTool(a, 'papan', 'B', {
      thread: 'B',
      start: 1,
      end: 3,
    });
    expect(replaceTool(controller, id, ab)).toBeNull();
    expect(controller.getState().tools[0]?.spans).toHaveLength(2);

    expect(replaceTool(controller, id, null)).toBeNull();
    expect(controller.getState().tools).toHaveLength(0);
  });

  it('rentang tidak valid: pesan error dikembalikan dan alat lama dipulihkan', () => {
    const controller = makeController();
    const good = buildMutexTool(null, 'papan', 'A', {
      thread: 'A',
      start: 1,
      end: 3,
    });
    replaceTool(controller, id, good);

    const bad = buildMutexTool(good, 'papan', 'A', {
      thread: 'A',
      start: 1,
      end: 99,
    });
    const message = replaceTool(controller, id, bad);
    expect(message).toMatch(/di luar program/);
    expect(controller.getState().tools).toEqual([good]);
  });

  it('saat simulasi sudah dimulai: ditolak dengan pesan terkunci, alat lama tetap', () => {
    const controller = makeController();
    const good = buildMutexTool(null, 'papan', 'A', {
      thread: 'A',
      start: 1,
      end: 3,
    });
    replaceTool(controller, id, good);
    controller.step();

    const message = replaceTool(controller, id, null);
    expect(message).toMatch(/terkunci/);
    expect(controller.getState().tools).toEqual([good]);
  });

  it('mutex pas di kedua robot lewat alur Toolbox menghasilkan 3 bintang pada seed tutorial', () => {
    const controller = makeController();
    let tool: PlacedTool | null = null;
    for (const thread of ['A', 'B']) {
      tool = buildMutexTool(tool, 'papan', thread, {
        thread,
        start: 1,
        end: 3,
      });
      expect(replaceTool(controller, id, tool)).toBeNull();
    }
    for (
      let i = 0;
      i < 100 && controller.getState().runState !== 'finished';
      i++
    )
      controller.step();
    expect(controller.getState().result?.stars).toBe(3);
  });
});
