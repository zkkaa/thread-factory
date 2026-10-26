import { describe, it, expect } from 'vitest';
import { SimulationController } from '../../controller/SimulationController';
import type { Clock } from '../../controller/clock';
import { Engine } from '../../engine/engine';
import type { PlacedTool } from '../../engine/tools';
import type { SimEvent } from '../../engine/types';
import { level1_1 } from '../../levels/module1/level-1-1';
import { EventLog, describeEvent } from '../eventLog';

const noClock: Clock = { requestFrame: () => 1, cancelFrame: () => {} };
const nameOf = (id: string): string => `Robot ${id}`;

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
  const controller = new SimulationController(new Engine(), noClock);
  controller.loadLevel(level1_1);
  return controller;
}

function attach(controller: SimulationController): EventLog {
  const log = new EventLog();
  controller.subscribe((state) => log.push(state));
  return log;
}

describe('describeEvent', () => {
  it('menerjemahkan tiap jenis event menjadi kalimat Indonesia', () => {
    const cases: [SimEvent, string][] = [
      [
        {
          type: 'THREAD_STATE',
          tick: 3,
          thread: 'A',
          from: 'RUNNING',
          to: 'WAITING',
        },
        'Robot A: RUNNING → WAITING',
      ],
      [
        { type: 'INSTRUCTION', tick: 3, thread: 'A', index: 1, op: 'READ' },
        'Robot A menjalankan READ',
      ],
      [
        {
          type: 'VAR_WRITTEN',
          tick: 3,
          thread: 'B',
          name: 'stok',
          oldValue: 4,
          newValue: 5,
        },
        'Robot B menulis stok: 4 → 5',
      ],
      [
        { type: 'LOCK_ACQUIRED', tick: 3, thread: 'A', mutex: 'papan' },
        'Robot A memegang kunci pintu "papan"',
      ],
      [
        { type: 'LOCK_RELEASED', tick: 3, thread: 'A', mutex: 'papan' },
        'Robot A melepas kunci pintu "papan"',
      ],
      [
        { type: 'BLOCKED', tick: 3, thread: 'B', on: 'mutex:papan' },
        'Robot B menunggu (mutex:papan)',
      ],
      [
        { type: 'DEADLOCK_DETECTED', tick: 9, cycle: ['A', 'B'] },
        'Deadlock terdeteksi: Robot A → Robot B',
      ],
      [{ type: 'FINISHED', tick: 60 }, 'Simulasi selesai'],
    ];
    for (const [event, text] of cases) {
      const entry = describeEvent(event, nameOf);
      expect(entry.text).toBe(text);
      expect(entry.tick).toBe(event.tick);
    }
  });

  it('hanya perpindahan NEW/READY/RUNNING yang dianggap minor', () => {
    const state = (
      from: 'NEW' | 'READY' | 'RUNNING' | 'WAITING',
      to: 'READY' | 'RUNNING' | 'WAITING' | 'TERMINATED',
    ) =>
      describeEvent(
        { type: 'THREAD_STATE', tick: 1, thread: 'A', from, to },
        nameOf,
      ).minor;
    expect(state('READY', 'RUNNING')).toBe(true);
    expect(state('RUNNING', 'READY')).toBe(true);
    expect(state('NEW', 'READY')).toBe(true);
    expect(state('RUNNING', 'WAITING')).toBe(false);
    expect(state('WAITING', 'READY')).toBe(false);
    expect(state('RUNNING', 'TERMINATED')).toBe(false);
  });
});

describe('EventLog dengan controller sungguhan', () => {
  it('awalnya kosong; mencatat event tiap tick secara kronologis dengan nama robot', () => {
    const controller = makeController();
    const log = attach(controller);
    expect(log.getEntries()).toHaveLength(0);

    controller.step();
    controller.step();
    const entries = log.getEntries();
    expect(entries.length).toBeGreaterThan(0);
    expect(
      entries.every((e, i) => i === 0 || e.tick >= (entries[i - 1]?.tick ?? 0)),
    ).toBe(true);
    expect(entries.some((e) => e.text.startsWith('Robot '))).toBe(true);
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length);
  });

  it('notifikasi yang memakai ulang array events (mis. setSpeed) tidak mencatat dua kali', () => {
    const controller = makeController();
    const log = attach(controller);
    controller.step();
    const before = log.getEntries().length;

    controller.setSpeed(5);
    controller.setSpeed(0.5);
    expect(log.getEntries()).toHaveLength(before);
  });

  it('Reset mengosongkan log; memasang alat juga mengosongkan', () => {
    const controller = makeController();
    const log = attach(controller);
    controller.step();
    controller.step();
    expect(log.getEntries().length).toBeGreaterThan(0);

    controller.reset();
    expect(log.getEntries()).toHaveLength(0);

    controller.step();
    controller.reset();
    controller.placeTool(MUTEX_PAS);
    expect(log.getEntries()).toHaveLength(0);
  });

  it('dengan mutex: log memuat kunci dipegang, robot menunggu, kunci dilepas, dan selesai', () => {
    const controller = makeController();
    controller.placeTool(MUTEX_PAS);
    const log = attach(controller);
    for (
      let i = 0;
      i < 100 && controller.getState().runState !== 'finished';
      i++
    )
      controller.step();

    const kinds = new Set(log.getEntries().map((e) => e.kind));
    for (const kind of [
      'lock',
      'unlock',
      'blocked',
      'write',
      'finished',
    ] as const) {
      expect(kinds.has(kind)).toBe(true);
    }
    expect(
      log.getEntries().some((e) => e.text.includes('menunggu (mutex:papan)')),
    ).toBe(true);
    const entries = log.getEntries();
    expect(entries[entries.length - 1]?.text).toBe('Simulasi selesai');
  });

  it('event dari beberapa tick dalam satu notifikasi (kecepatan tinggi) semuanya tercatat', () => {
    const log = new EventLog();
    const controller = makeController();
    const snapshot = controller.getState().snapshot;
    if (snapshot === null) throw new Error('snapshot kosong');
    const events: SimEvent[] = [
      { type: 'INSTRUCTION', tick: 1, thread: 'A', index: 0, op: 'WORK' },
      { type: 'INSTRUCTION', tick: 2, thread: 'B', index: 0, op: 'WORK' },
      { type: 'INSTRUCTION', tick: 3, thread: 'A', index: 1, op: 'READ' },
    ];
    log.push({
      ...controller.getState(),
      snapshot: { ...snapshot, tick: 3 },
      events,
    });
    expect(log.getEntries().map((e) => e.tick)).toEqual([1, 2, 3]);
  });

  it('hanya `limit` entri terbaru yang disimpan', () => {
    const controller = makeController();
    const limited = new EventLog(5);
    const unlimited = new EventLog(1000);
    controller.subscribe((state) => {
      limited.push(state);
      unlimited.push(state);
    });
    for (let i = 0; i < 30; i++) controller.step();

    expect(unlimited.getEntries().length).toBeGreaterThan(5);
    expect(limited.getEntries()).toHaveLength(5);
    expect(limited.getEntries()).toEqual(unlimited.getEntries().slice(-5));
  });

  it('getEntries mengembalikan objek yang sama selama tidak ada perubahan; subscribe diberi tahu', () => {
    const controller = makeController();
    const log = attach(controller);
    let notified = 0;
    const off = log.subscribe(() => notified++);

    const first = log.getEntries();
    expect(log.getEntries()).toBe(first);

    controller.step();
    expect(notified).toBe(1);
    expect(log.getEntries()).not.toBe(first);

    off();
    controller.step();
    expect(notified).toBe(1);
  });
});
