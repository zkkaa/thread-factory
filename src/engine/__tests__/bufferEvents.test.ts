import { describe, expect, it } from 'vitest';
import { Engine } from '../engine';
import type { EngineConfig, SimEvent } from '../types';

describe('event ban berjalan (T-049)', () => {
  it('BUFFER_PUT membawa items, BUFFER_OVERFLOW membawa capacity', () => {
    const config: EngineConfig = {
      threads: [
        {
          id: 'P',
          label: 'Producer',
          program: [{ op: 'PUT_ITEM', buffer: 'ban' }],
          repeat: 3,
        },
      ],
      sharedVars: {},
      mutexes: [],
      semaphores: {},
      conditions: [],
      scheduler: { kind: 'random', cores: 1 },
      buffers: { ban: 2 },
      maxTicks: 100,
    };
    const engine = new Engine();
    engine.load(config, 1);
    const events: SimEvent[] = [];
    while (!engine.isFinished) events.push(...engine.step().events);

    const puts = events.filter((e) => e.type === 'BUFFER_PUT');
    const overflows = events.filter((e) => e.type === 'BUFFER_OVERFLOW');
    expect(puts.map((e) => e.items)).toEqual([1, 2]);
    expect(overflows).toHaveLength(1);
    expect(overflows[0]?.capacity).toBe(2);
    expect(overflows[0]?.buffer).toBe('ban');
  });
});
