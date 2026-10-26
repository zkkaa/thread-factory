import { useCallback, useSyncExternalStore } from 'react';
import type {
  ControllerState,
  SimulationController,
} from '../../controller/SimulationController';

/**
 * Berlangganan ke SimulationController dan mengembalikan keadaannya.
 * Memakai useSyncExternalStore (bawaan React), jadi tidak perlu library state.
 * Controller mengembalikan objek yang sama selama tidak ada perubahan, sehingga
 * komponen hanya dirender ulang bila state benar-benar berubah.
 */
export function useSimulation(
  controller: SimulationController,
): ControllerState {
  const subscribe = useCallback(
    (onChange: () => void) => controller.subscribe(onChange),
    [controller],
  );
  const getSnapshot = useCallback(() => controller.getState(), [controller]);
  return useSyncExternalStore(subscribe, getSnapshot);
}
