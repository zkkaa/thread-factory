import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import type { SimulationController } from '../../controller/SimulationController';
import { EventLog, type LogEntry } from '../eventLog';

/**
 * Mengumpulkan kejadian dari controller menjadi riwayat. Berlangganan langsung
 * ke controller (bukan lewat render React) supaya tidak ada notifikasi yang
 * terlewat walau React menggabungkan beberapa render.
 */
export function useEventLog(controller: SimulationController): readonly LogEntry[] {
  const [log] = useState(() => new EventLog());

  useEffect(() => controller.subscribe((state) => log.push(state)), [controller, log]);

  const subscribe = useCallback((onChange: () => void) => log.subscribe(onChange), [log]);
  const getSnapshot = useCallback(() => log.getEntries(), [log]);
  return useSyncExternalStore(subscribe, getSnapshot);
}