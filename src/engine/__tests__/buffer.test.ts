import { describe, expect, it } from 'vitest';
import { Engine } from '../engine';
import { BoundedBuffer } from '../primitives/buffer';
import type { EngineConfig, ThreadDef } from '../types';

function config(
  threads: ThreadDef[],
  overrides: Partial<EngineConfig> = {},
): EngineConfig {
  return {
    threads,
    sharedVars: {},
    mutexes: [],
    semaphores: {},
    conditions: [],
    scheduler: { kind: 'random', cores: 2 },
    buffers: { ban: 2 },
    maxTicks: 2000,
    ...overrides,
  };
}

function runToEnd(cfg: EngineConfig, seed = 1) {
  const engine = new Engine();
  engine.load(cfg, seed);
  while (!engine.isFinished) engine.step();
  return engine.getSnapshot();
}

describe('BoundedBuffer', () => {
  it('menolak kapasitas yang tidak valid', () => {
    expect(() => new BoundedBuffer('b', 0)).toThrow();
    expect(() => new BoundedBuffer('b', 1.5)).toThrow();
  });

  it('put sampai penuh, lalu overflow dihitung dan isi tidak bertambah', () => {
    const b = new BoundedBuffer('b', 2);
    expect(b.put()).toBe(true);
    expect(b.put()).toBe(true);
    expect(b.put()).toBe(false);
    expect(b.count).toBe(2);
    expect(b.snapshot().overflows).toBe(1);
    expect(b.snapshot().totalPut).toBe(2);
  });

  it('take pada ban kosong menjadi underflow', () => {
    const b = new BoundedBuffer('b', 2);
    expect(b.take()).toBe(false);
    expect(b.snapshot().underflows).toBe(1);
    b.put();
    expect(b.take()).toBe(true);
    expect(b.count).toBe(0);
    expect(b.snapshot().totalTaken).toBe(1);
  });
});

describe('PUT_ITEM dan TAKE_ITEM di engine (T-048)', () => {
  it('producer tanpa pengaman: ban kapasitas 2, 6 barang, 4 overflow', () => {
    const producer: ThreadDef = {
      id: 'P',
      label: 'Producer',
      program: [{ op: 'PUT_ITEM', buffer: 'ban' }],
      repeat: 6,
    };
    const snap = runToEnd(config([producer]));
    expect(snap.overflowCount).toBe(4);
    expect(snap.underflowCount).toBe(0);
    expect(snap.buffers[0].items).toBe(2);
  });

  it('consumer tanpa barang: setiap TAKE_ITEM adalah underflow', () => {
    const consumer: ThreadDef = {
      id: 'C',
      label: 'Consumer',
      program: [{ op: 'TAKE_ITEM', buffer: 'ban' }],
      repeat: 3,
    };
    const snap = runToEnd(config([consumer]));
    expect(snap.underflowCount).toBe(3);
    expect(snap.overflowCount).toBe(0);
  });

  it('pemancaran event overflow dan underflow', () => {
    const engine = new Engine();
    engine.load(
      config(
        [
          {
            id: 'C',
            label: 'C',
            program: [{ op: 'TAKE_ITEM', buffer: 'ban' }],
          },
        ],
        { scheduler: { kind: 'random', cores: 1 } },
      ),
      1,
    );
    const types = engine.step().events.map((e) => e.type);
    expect(types).toContain('BUFFER_UNDERFLOW');
  });

  it('dengan semaphore empty dan full: tidak ada overflow atau underflow pada 200 seed', () => {
    const producer: ThreadDef = {
      id: 'P',
      label: 'Producer',
      program: [
        { op: 'SEM_WAIT', sem: 'empty' },
        { op: 'PUT_ITEM', buffer: 'ban' },
        { op: 'SEM_SIGNAL', sem: 'full' },
      ],
      repeat: 6,
    };
    const consumer: ThreadDef = {
      id: 'C',
      label: 'Consumer',
      program: [
        { op: 'SEM_WAIT', sem: 'full' },
        { op: 'TAKE_ITEM', buffer: 'ban' },
        { op: 'SEM_SIGNAL', sem: 'empty' },
      ],
      repeat: 6,
    };
    for (let seed = 1; seed <= 200; seed += 1) {
      const snap = runToEnd(
        config([producer, consumer], { semaphores: { empty: 2, full: 0 } }),
        seed,
      );
      expect(snap.overflowCount, `seed ${seed}`).toBe(0);
      expect(snap.underflowCount, `seed ${seed}`).toBe(0);
      expect(snap.buffers[0].totalPut, `seed ${seed}`).toBe(6);
      expect(snap.buffers[0].totalTaken, `seed ${seed}`).toBe(6);
      expect(snap.buffers[0].items, `seed ${seed}`).toBe(0);
      expect(
        snap.threads.every((t) => t.state === 'TERMINATED'),
        `seed ${seed}`,
      ).toBe(true);
    }
  });

  it('reset mengosongkan ban dan menghapus hitungan', () => {
    const engine = new Engine();
    engine.load(
      config([
        {
          id: 'P',
          label: 'P',
          program: [{ op: 'PUT_ITEM', buffer: 'ban' }],
          repeat: 5,
        },
      ]),
      1,
    );
    while (!engine.isFinished) engine.step();
    expect(engine.getSnapshot().overflowCount).toBe(3);
    engine.reset();
    expect(engine.getSnapshot().overflowCount).toBe(0);
    expect(engine.getSnapshot().buffers[0].items).toBe(0);
  });
});

describe('validateConfig untuk ban (T-048)', () => {
  const putter: ThreadDef = {
    id: 'P',
    label: 'P',
    program: [{ op: 'PUT_ITEM', buffer: 'ban' }],
  };

  it('menolak ban yang dipakai tetapi tidak dideklarasikan', () => {
    const engine = new Engine();
    expect(() => engine.load(config([putter], { buffers: {} }), 1)).toThrow(
      /ban "ban" tidak dideklarasikan/,
    );
  });

  it('menolak kapasitas ban 0', () => {
    const engine = new Engine();
    expect(() =>
      engine.load(config([putter], { buffers: { ban: 0 } }), 1),
    ).toThrow(/Kapasitas ban/);
  });
});
