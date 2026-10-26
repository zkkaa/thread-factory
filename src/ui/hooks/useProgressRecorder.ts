import { useEffect } from 'react';
import type { SimulationController } from '../../controller/SimulationController';
import type { ProgressStore } from '../../progress/progressStore';
import { startProgressRecorder } from '../progressRecorder';

/** Memasang pencatat bintang selama komponen terpasang (aman di StrictMode). */
export function useProgressRecorder(
  controller: SimulationController,
  store: ProgressStore,
): void {
  useEffect(
    () => startProgressRecorder(controller, store),
    [controller, store],
  );
}
