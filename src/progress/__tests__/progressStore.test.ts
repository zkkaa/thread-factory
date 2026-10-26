import { describe, expect, it, vi } from 'vitest';
import {
  PROGRESS_KEY,
  ProgressStore,
  getBestStars,
  isLevelCleared,
  totalStars,
} from '../progressStore';
import { createMemoryStorage } from '../storage';
import { createBrokenStorage, createFullStorage } from './fakeStorage';

describe('ProgressStore', () => {
  it('mulai kosong', () => {
    const store = new ProgressStore(createMemoryStorage());
    expect(store.getState().levels).toEqual({});
    expect(isLevelCleared(store.getState(), '1-1')).toBe(false);
    expect(getBestStars(store.getState(), '1-1')).toBe(0);
  });

  it('record menyimpan bintang dan menandai level selesai', () => {
    const store = new ProgressStore(createMemoryStorage());
    store.record('1-1', 2);
    expect(isLevelCleared(store.getState(), '1-1')).toBe(true);
    expect(getBestStars(store.getState(), '1-1')).toBe(2);
  });

  it('bintang hanya naik, tidak pernah turun', () => {
    const store = new ProgressStore(createMemoryStorage());
    store.record('1-1', 2);
    store.record('1-1', 1);
    expect(getBestStars(store.getState(), '1-1')).toBe(2);
    store.record('1-1', 3);
    expect(getBestStars(store.getState(), '1-1')).toBe(3);
  });

  it('mengabaikan nilai bintang yang tidak sah', () => {
    const store = new ProgressStore(createMemoryStorage());
    for (const nilai of [0, 4, -1, 1.5, Number.NaN]) {
      store.record('1-1', nilai);
    }
    expect(store.getState().levels).toEqual({});
  });

  it('tersimpan dan terbaca kembali oleh store baru', () => {
    const storage = createMemoryStorage();
    new ProgressStore(storage).record('1-1', 3);
    const dimuat = new ProgressStore(storage);
    expect(getBestStars(dimuat.getState(), '1-1')).toBe(3);
    expect(isLevelCleared(dimuat.getState(), '1-1')).toBe(true);
  });

  it('data rusak atau berversi asing menghasilkan progres kosong', () => {
    const rusak = [
      '{bukan json',
      'null',
      '[]',
      '{"version":2,"levels":{}}',
      '{"version":1,"levels":[]}',
      '{"version":1,"levels":{"1-1":{"bestStars":9,"cleared":true}}}',
      '{"version":1,"levels":{"1-1":{"bestStars":1}}}',
    ];
    for (const raw of rusak) {
      const storage = createMemoryStorage();
      storage.setItem(PROGRESS_KEY, raw);
      expect(new ProgressStore(storage).getState().levels).toEqual({});
    }
  });

  it('tetap berjalan di memori bila penyimpanan rusak total', () => {
    const store = new ProgressStore(createBrokenStorage());
    store.record('1-1', 2);
    expect(getBestStars(store.getState(), '1-1')).toBe(2);
  });

  it('tetap berjalan di memori bila penyimpanan penuh', () => {
    const store = new ProgressStore(createFullStorage());
    store.record('1-1', 1);
    expect(isLevelCleared(store.getState(), '1-1')).toBe(true);
  });

  it('reset menghapus progres di memori dan di penyimpanan', () => {
    const storage = createMemoryStorage();
    const store = new ProgressStore(storage);
    store.record('1-1', 3);
    store.reset();
    expect(store.getState().levels).toEqual({});
    expect(storage.getItem(PROGRESS_KEY)).toBeNull();
    expect(new ProgressStore(storage).getState().levels).toEqual({});
  });

  it('subscribe hanya dipanggil saat ada perubahan', () => {
    const store = new ProgressStore(createMemoryStorage());
    const listener = vi.fn();
    const berhenti = store.subscribe(listener);
    store.record('1-1', 1);
    expect(listener).toHaveBeenCalledTimes(1);
    store.record('1-1', 1); // tidak berubah
    store.record('1-1', 0); // tidak sah
    expect(listener).toHaveBeenCalledTimes(1);
    store.record('1-1', 2);
    expect(listener).toHaveBeenCalledTimes(2);
    berhenti();
    store.record('1-1', 3);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('getState mengembalikan objek yang sama bila tidak ada perubahan', () => {
    const store = new ProgressStore(createMemoryStorage());
    const sebelum = store.getState();
    store.record('1-1', 0);
    expect(store.getState()).toBe(sebelum);
    store.record('1-1', 1);
    expect(store.getState()).not.toBe(sebelum);
  });

  it('totalStars menjumlahkan bintang terbaik', () => {
    const store = new ProgressStore(createMemoryStorage());
    store.record('1-1', 3);
    store.record('1-2', 1);
    expect(totalStars(store.getState(), ['1-1', '1-2', '1-3'])).toBe(4);
  });
});
