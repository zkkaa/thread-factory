import { useSyncExternalStore } from 'react';
import type { SettingsData, SettingsStore } from '../../progress/settingsStore';

/** Pengaturan pemain saat ini; komponen dirender ulang hanya bila berubah. */
export function useSettings(store: SettingsStore): Readonly<SettingsData> {
  return useSyncExternalStore(store.subscribe, store.getState);
}
