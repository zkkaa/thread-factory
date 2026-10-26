import { describe, expect, it, vi } from 'vitest';
import type { ControllerState } from '../../controller/SimulationController';
import type { LevelResult } from '../../controller/evaluateLevel';
import { level1_1 } from '../../levels';
import {
  ProgressStore,
  getBestStars,
  isLevelCleared,
} from '../../progress/progressStore';
import { createMemoryStorage } from '../../progress/storage';
import {
  type RecorderSource,
  startProgressRecorder,
} from '../progressRecorder';

type Emisi = Pick<ControllerState, 'level' | 'result'>;

/** Sumber palsu yang meniru subscribe milik controller. */
function buatSumber() {
  const listeners = new Set<(state: Emisi) => void>();
  const sumber: RecorderSource = {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
  return {
    sumber,
    emit: (state: Emisi) => {
      for (const listener of [...listeners]) listener(state);
    },
    jumlahPelanggan: () => listeners.size,
  };
}

/** Hasil palsu; hanya ok dan stars yang dibaca pencatat. */
function hasil(ok: boolean, stars: LevelResult['stars']): LevelResult {
  return { ok, stars, message: '' } as unknown as LevelResult;
}

describe('startProgressRecorder', () => {
  it('mencatat bintang saat hasil benar dan berbintang', () => {
    const { sumber, emit } = buatSumber();
    const store = new ProgressStore(createMemoryStorage());
    startProgressRecorder(sumber, store);
    emit({ level: level1_1, result: hasil(true, 2) });
    expect(getBestStars(store.getState(), '1-1')).toBe(2);
    expect(isLevelCleared(store.getState(), '1-1')).toBe(true);
  });

  it('tidak mencatat hasil salah, tanpa bintang, atau tanpa level', () => {
    const { sumber, emit } = buatSumber();
    const store = new ProgressStore(createMemoryStorage());
    startProgressRecorder(sumber, store);
    emit({ level: level1_1, result: null });
    emit({ level: level1_1, result: hasil(false, 0) });
    emit({ level: level1_1, result: hasil(true, null) }); // seed non-tutorial
    emit({ level: null, result: hasil(true, 3) });
    expect(store.getState().levels).toEqual({});
  });

  it('satu objek hasil hanya dicatat satu kali', () => {
    const { sumber, emit } = buatSumber();
    const store = new ProgressStore(createMemoryStorage());
    const catat = vi.spyOn(store, 'record');
    startProgressRecorder(sumber, store);
    const sama = hasil(true, 1);
    emit({ level: level1_1, result: sama });
    emit({ level: level1_1, result: sama });
    emit({ level: level1_1, result: sama });
    expect(catat).toHaveBeenCalledTimes(1);
  });

  it('percobaan berikutnya yang lebih buruk tidak menurunkan bintang', () => {
    const { sumber, emit } = buatSumber();
    const store = new ProgressStore(createMemoryStorage());
    startProgressRecorder(sumber, store);
    emit({ level: level1_1, result: hasil(true, 3) });
    emit({ level: level1_1, result: null }); // Reset
    emit({ level: level1_1, result: hasil(true, 1) });
    expect(getBestStars(store.getState(), '1-1')).toBe(3);
  });

  it('berhenti mencatat setelah berhenti berlangganan', () => {
    const { sumber, emit, jumlahPelanggan } = buatSumber();
    const store = new ProgressStore(createMemoryStorage());
    const berhenti = startProgressRecorder(sumber, store);
    expect(jumlahPelanggan()).toBe(1);
    berhenti();
    expect(jumlahPelanggan()).toBe(0);
    emit({ level: level1_1, result: hasil(true, 3) });
    expect(store.getState().levels).toEqual({});
  });

  it('progres yang tercatat terbaca kembali oleh store baru', () => {
    const storage = createMemoryStorage();
    const { sumber, emit } = buatSumber();
    startProgressRecorder(sumber, new ProgressStore(storage));
    emit({ level: level1_1, result: hasil(true, 2) });
    const dimuat = new ProgressStore(storage);
    expect(getBestStars(dimuat.getState(), '1-1')).toBe(2);
  });
});
