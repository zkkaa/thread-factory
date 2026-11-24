import { describe, expect, it } from 'vitest';
import { SimulationController } from '../../controller/SimulationController';
import { level2_1 } from '../module2/level-2-1';
import { level2_2 } from '../module2/level-2-2';
import {
  applySandboxParams,
  defaultSandboxValues,
  isSandboxSupported,
  sandboxParamsFor,
} from '../sandbox';
import { level1_1 } from '../module1/level-1-1';
// Level yang pasti tidak punya parameter Sandbox.
const unsupportedLevel = { ...level1_1, id: '9-9' };

function runToEnd(controller: SimulationController) {
  for (let i = 0; i < 5000; i++) {
    if (controller.getState().runState === 'finished') break;
    controller.step();
  }
  return controller.getState();
}

describe('applySandboxParams: pendukung dan validasi', () => {
  it('hanya level yang terdaftar di SANDBOX_PARAMS yang mendukung Sandbox', () => {
    expect(isSandboxSupported('1-1')).toBe(true);
    expect(isSandboxSupported('2-1')).toBe(true);
    expect(isSandboxSupported('2-2')).toBe(true);
    expect(isSandboxSupported('9-9')).toBe(false);
    expect(sandboxParamsFor('9-9')).toEqual([]);
  });

  it('level tanpa dukungan melempar error', () => {
    expect(() => applySandboxParams(unsupportedLevel, {})).toThrow(
      /belum mendukung/,
    );
  });

  it('kunci yang tidak dikenal ditolak', () => {
    expect(() => applySandboxParams(level2_1, { lockPolicy: 'fair' })).toThrow(
      /tidak ada/,
    );
  });

  it('nilai di luar batas, bukan bulat, atau bukan angka ditolak', () => {
    expect(() => applySandboxParams(level2_1, { cores: 0 })).toThrow(/antara/);
    expect(() => applySandboxParams(level2_1, { cores: 99 })).toThrow(/antara/);
    expect(() => applySandboxParams(level2_1, { cores: 2.5 })).toThrow(/bulat/);
    expect(() => applySandboxParams(level2_1, { cores: '2' })).toThrow(/bulat/);
  });

  it('kebijakan di luar pilihan ditolak', () => {
    expect(() => applySandboxParams(level2_2, { lockPolicy: 'acak' })).toThrow(
      /tidak sah/,
    );
  });
});

describe('applySandboxParams: nilai awal setara level asli', () => {
  it('Level 2-1: tanpa nilai, thread, ban, dan semaphore sama', () => {
    const { level } = applySandboxParams(level2_1, {});
    expect(level.threads.map((t) => t.repeat)).toEqual(
      level2_1.threads.map((t) => t.repeat),
    );
    expect(level.buffers).toEqual(level2_1.buffers);
    expect(level.resources).toEqual(level2_1.resources);
    expect(level.scheduler).toEqual(level2_1.scheduler);
  });

  it('Level 2-2: tanpa nilai, repeat dan cores sama; kebijakan awal reader', () => {
    const { level, rwPolicy } = applySandboxParams(level2_2, {});
    expect(level.threads.map((t) => t.repeat)).toEqual(
      level2_2.threads.map((t) => t.repeat),
    );
    expect(level.scheduler).toEqual(level2_2.scheduler);
    expect(rwPolicy).toBe('reader');
  });

  it('nilai awal di daftar parameter cocok dengan data level', () => {
    const d21 = defaultSandboxValues('2-1');
    expect(d21.repeat).toBe(level2_1.threads[0]?.repeat);
    expect(d21.cores).toBe(level2_1.scheduler.cores);
    expect(d21.bufferCapacity).toBe(level2_1.buffers?.ban);
    const d22 = defaultSandboxValues('2-2');
    const reader = level2_2.threads.find((t) => t.id.startsWith('R'));
    const writer = level2_2.threads.find((t) => t.id.startsWith('W'));
    expect(d22.readRepeat).toBe(reader?.repeat);
    expect(d22.writeRepeat).toBe(writer?.repeat);
    expect(d22.cores).toBe(level2_2.scheduler.cores);
  });
});

describe('applySandboxParams: efek parameter', () => {
  it('kapasitas ban mengubah buffers dan semaphore empty bersamaan', () => {
    const { level } = applySandboxParams(level2_1, { bufferCapacity: 5 });
    expect(level.buffers).toEqual({ ban: 5 });
    const empty = level.resources.find((r) => r.id === 'empty');
    expect(empty).toMatchObject({ kind: 'semaphore', initialValue: 5 });
    const full = level.resources.find((r) => r.id === 'full');
    expect(full).toMatchObject({ initialValue: 0 });
  });

  it('repeat 2-1 mengubah semua thread dan target invariant', () => {
    const { level } = applySandboxParams(level2_1, { repeat: 2 });
    expect(level.threads.every((t) => t.repeat === 2)).toBe(true);
    const snap = {
      overflowCount: 0,
      underflowCount: 0,
      buffers: [{ totalTaken: 4 }],
    } as unknown as Parameters<typeof level.goal.invariant>[0];
    expect(level.goal.invariant(snap).ok).toBe(true);
  });

  it('readRepeat dan writeRepeat hanya mengubah kelompoknya', () => {
    const { level } = applySandboxParams(level2_2, {
      readRepeat: 4,
      writeRepeat: 2,
    });
    for (const t of level.threads) {
      expect(t.repeat).toBe(t.id.startsWith('R') ? 4 : 2);
    }
  });

  it('cores diterapkan ke scheduler', () => {
    const { level } = applySandboxParams(level2_2, { cores: 3 });
    expect(level.scheduler.cores).toBe(3);
  });

  it('kebijakan dikembalikan terpisah dari level', () => {
    const { rwPolicy } = applySandboxParams(level2_2, { lockPolicy: 'fair' });
    expect(rwPolicy).toBe('fair');
  });

  it('level asli tidak berubah', () => {
    const before = structuredClone({
      threads: level2_1.threads,
      buffers: level2_1.buffers,
      resources: level2_1.resources,
      maxTicks: level2_1.maxTicks,
    });
    applySandboxParams(level2_1, {
      repeat: 1,
      cores: 1,
      bufferCapacity: 7,
    });
    expect({
      threads: level2_1.threads,
      buffers: level2_1.buffers,
      resources: level2_1.resources,
      maxTicks: level2_1.maxTicks,
    }).toEqual(before);
  });
});

describe('Sandbox dengan controller sungguhan', () => {
  it('Level 2-2 dimuat tanpa bintang, hasil tetap dinilai', () => {
    const { level, rwPolicy } = applySandboxParams(level2_2, {
      lockPolicy: 'fair',
    });
    const controller = new SimulationController();
    controller.loadLevel(level, undefined, { rated: false, rwPolicy });
    const state = runToEnd(controller);
    expect(state.runState).toBe('finished');
    expect(state.result).not.toBeNull();
    expect(state.result?.stars).toBeNull();
  });

  it('Level 2-1 tanpa alat berjalan sampai selesai dengan parameter baru', () => {
    const { level } = applySandboxParams(level2_1, {
      repeat: 2,
      bufferCapacity: 5,
    });
    const controller = new SimulationController();
    controller.loadLevel(level, undefined, { rated: false });
    const state = runToEnd(controller);
    expect(state.runState).toBe('finished');
    expect(state.result?.stars).toBeNull();
  });
});
