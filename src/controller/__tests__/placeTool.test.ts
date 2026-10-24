import { describe, it, expect } from 'vitest';
import type { PlacedTool } from '../../engine/tools';
import type { ThreadDef } from '../../engine/types';
import type { LevelDefinition, ToolType } from '../../levels/types';
import type { Clock } from '../clock';
import { SimulationController } from '../SimulationController';

/** Jam palsu: tes ini tidak butuh waktu berjalan, hanya status 'running'. */
const fakeClock: Clock = { requestFrame: () => 1, cancelFrame: () => undefined };

function robot(id: string): ThreadDef {
  return {
    id,
    label: `Robot ${id}`,
    repeat: 5,
    program: [
      { op: 'WORK', ticks: 1 },
      { op: 'READ', from: 'stok', into: 'r' },
      { op: 'COMPUTE', reg: 'r', add: 1 },
      { op: 'WRITE', reg: 'r', to: 'stok' },
    ],
  };
}

/** Level 1-1 sederhana untuk tes; seed 10 menghasilkan stok 8 tanpa mutex (T-017). */
function makeLevel(availableTools: ToolType[] = ['mutex']): LevelDefinition {
  return {
    id: 'tes-1-1',
    module: 1,
    title: 'Level uji',
    intro: '',
    threads: [robot('A'), robot('B')],
    sharedVars: { stok: 0 },
    resources: [{ kind: 'mutex', id: 'pintu' }],
    availableTools,
    scheduler: { kind: 'random', cores: 1 },
    tutorialSeed: 10,
    maxTicks: 1000,
    goal: {
      target: { variable: 'stok', value: 10 },
      invariant: (snap) => ({ ok: snap.sharedVars.stok === 10, message: '' }),
      stars: { fast: 100, lowWait: 100 },
    },
  };
}

/** Pintu yang menutupi baca-hitung-tulis (indeks 1..3) di kedua robot. */
function makeDoor(id = 'pintu-stok'): PlacedTool {
  return {
    id,
    kind: 'mutex',
    mutex: 'pintu',
    spans: [
      { thread: 'A', start: 1, end: 3 },
      { thread: 'B', start: 1, end: 3 },
    ],
  };
}

function makeController(level: LevelDefinition = makeLevel()): SimulationController {
  const controller = new SimulationController(undefined, fakeClock);
  controller.loadLevel(level);
  return controller;
}

/** Jalankan tick demi tick sampai selesai, lalu kembalikan stok akhir. */
function stepUntilFinished(controller: SimulationController): number {
  for (let i = 0; i < 2000 && controller.getState().runState !== 'finished'; i++) {
    controller.step();
  }
  expect(controller.getState().runState).toBe('finished');
  return controller.getState().snapshot?.sharedVars.stok as number;
}

describe('placeTool dan removeTool (T-025)', () => {
  it('level yang baru dimuat belum punya alat', () => {
    expect(makeController().getState().tools).toEqual([]);
  });

  it('placeTool menambah alat ke state dan memberi tahu pendengar', () => {
    const controller = makeController();
    const before = controller.getState();
    let notified = 0;
    controller.subscribe(() => (notified += 1));

    controller.placeTool(makeDoor());

    expect(controller.getState().tools).toEqual([makeDoor()]);
    expect(controller.getState()).not.toBe(before);
    expect(notified).toBe(1);
  });

  it('alat yang dipasang benar-benar dipakai engine: stok jadi 10 pada seed 10', () => {
    const tanpaAlat = makeController();
    expect(stepUntilFinished(tanpaAlat)).not.toBe(10);

    const denganAlat = makeController();
    denganAlat.placeTool(makeDoor());
    expect(stepUntilFinished(denganAlat)).toBe(10);
  });

  it('removeTool melepas alat dan engine kembali ke konfigurasi tanpa alat', () => {
    const controller = makeController();
    controller.placeTool(makeDoor());
    controller.removeTool('pintu-stok');

    expect(controller.getState().tools).toEqual([]);
    expect(stepUntilFinished(controller)).not.toBe(10);
  });

  it('mengubah objek alat setelah dipasang tidak mengubah state', () => {
    const controller = makeController();
    const door = makeDoor();
    controller.placeTool(door);
    door.spans[0].end = 0;
    door.mutex = 'lain';

    expect(controller.getState().tools).toEqual([makeDoor()]);
  });

  describe('alat terkunci setelah simulasi dimulai', () => {
    it('terkunci saat paused (setelah step)', () => {
      const controller = makeController();
      controller.placeTool(makeDoor());
      controller.step();
      expect(controller.getState().runState).toBe('paused');

      expect(() => controller.placeTool(makeDoor('lain'))).toThrow(/terkunci/);
      expect(() => controller.removeTool('pintu-stok')).toThrow(/terkunci/);
    });

    it('terkunci saat running', () => {
      const controller = makeController();
      controller.run();
      expect(controller.getState().runState).toBe('running');

      expect(() => controller.placeTool(makeDoor())).toThrow(/terkunci/);
    });

    it('terkunci saat finished', () => {
      const controller = makeController();
      stepUntilFinished(controller);

      expect(() => controller.placeTool(makeDoor())).toThrow(/terkunci/);
    });

    it('reset membuka kunci dan alat yang sudah dipasang tetap ada', () => {
      const controller = makeController();
      controller.placeTool(makeDoor());
      controller.step();
      controller.reset();

      expect(controller.getState().runState).toBe('idle');
      expect(controller.getState().tools).toEqual([makeDoor()]);
      expect(() => controller.removeTool('pintu-stok')).not.toThrow();
      expect(controller.getState().tools).toEqual([]);
    });

    it('loadLevel mengosongkan alat', () => {
      const controller = makeController();
      controller.placeTool(makeDoor());
      controller.loadLevel(makeLevel());

      expect(controller.getState().tools).toEqual([]);
    });
  });

  describe('penolakan', () => {
    it('placeTool sebelum level dimuat', () => {
      const controller = new SimulationController(undefined, fakeClock);
      expect(() => controller.placeTool(makeDoor())).toThrow(/Belum ada level/);
    });

    it('alat yang tidak ada di availableTools level', () => {
      const controller = makeController(makeLevel([]));
      expect(() => controller.placeTool(makeDoor())).toThrow(/tidak tersedia/);
      expect(controller.getState().tools).toEqual([]);
    });

    it('id alat ganda', () => {
      const controller = makeController();
      controller.placeTool(makeDoor());
      expect(() => controller.placeTool(makeDoor())).toThrow(/sudah terpasang/);
      expect(controller.getState().tools).toHaveLength(1);
    });

    it('removeTool dengan id yang tidak ada', () => {
      const controller = makeController();
      expect(() => controller.removeTool('hantu')).toThrow(/tidak ditemukan/);
    });

    it('rentang tidak valid ditolak dan state tidak berubah', () => {
      const controller = makeController();
      const before = controller.getState();
      const invalid: PlacedTool = {
        ...makeDoor(),
        spans: [{ thread: 'A', start: 0, end: 9 }],
      };

      expect(() => controller.placeTool(invalid)).toThrow(/di luar program/);
      expect(controller.getState()).toBe(before);
      expect(controller.getState().tools).toEqual([]);
    });
  });
});