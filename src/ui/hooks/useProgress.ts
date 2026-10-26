import { useSyncExternalStore } from 'react';
import type { ProgressData, ProgressStore } from '../../progress/progressStore';

/** Progres kampanye saat ini; komponen dirender ulang hanya bila berubah. */
export function useProgress(store: ProgressStore): Readonly<ProgressData> {
  return useSyncExternalStore(store.subscribe, store.getState);
}
