import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  SettingsStore,
} from '../settingsStore';
import { createMemoryStorage } from '../storage';
import { createBrokenStorage } from './fakeStorage';

describe('SettingsStore', () => {
  it('memakai pengaturan awal bila penyimpanan kosong', () => {
    const store = new SettingsStore(createMemoryStorage());
    expect(store.getState()).toEqual(DEFAULT_SETTINGS);
  });

  it('update tersimpan dan terbaca kembali', () => {
    const storage = createMemoryStorage();
    new SettingsStore(storage).update({
      volume: 0.2,
      reduceMotion: true,
      demoMode: true,
    });
    const dimuat = new SettingsStore(storage).getState();
    expect(dimuat.volume).toBe(0.2);
    expect(dimuat.reduceMotion).toBe(true);
    expect(dimuat.demoMode).toBe(true);
  });

  it('volume dibatasi 0 sampai 1 dan nilai bukan angka diabaikan', () => {
    const store = new SettingsStore(createMemoryStorage());
    store.update({ volume: 5 });
    expect(store.getState().volume).toBe(1);
    store.update({ volume: -3 });
    expect(store.getState().volume).toBe(0);
    store.update({ volume: Number.NaN });
    expect(store.getState().volume).toBe(0);
  });

  it('data rusak atau berversi asing menghasilkan pengaturan awal', () => {
    const rusak = [
      '{bukan json',
      'null',
      '{"version":2,"volume":0.5,"reduceMotion":false,"demoMode":false}',
      '{"version":1,"volume":"keras","reduceMotion":false,"demoMode":false}',
      '{"version":1,"volume":0.5,"reduceMotion":"ya","demoMode":false}',
    ];
    for (const raw of rusak) {
      const storage = createMemoryStorage();
      storage.setItem(SETTINGS_KEY, raw);
      expect(new SettingsStore(storage).getState()).toEqual(DEFAULT_SETTINGS);
    }
  });

  it('volume di luar rentang pada data tersimpan dibatasi saat dimuat', () => {
    const storage = createMemoryStorage();
    storage.setItem(
      SETTINGS_KEY,
      '{"version":1,"volume":7,"reduceMotion":true,"demoMode":false}',
    );
    const state = new SettingsStore(storage).getState();
    expect(state.volume).toBe(1);
    expect(state.reduceMotion).toBe(true);
  });

  it('tetap berjalan di memori bila penyimpanan rusak', () => {
    const store = new SettingsStore(createBrokenStorage());
    store.update({ demoMode: true });
    expect(store.getState().demoMode).toBe(true);
  });

  it('subscribe hanya dipanggil saat ada perubahan', () => {
    const store = new SettingsStore(createMemoryStorage());
    const listener = vi.fn();
    store.subscribe(listener);
    store.update({ demoMode: true });
    store.update({ demoMode: true }); // tidak berubah
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
