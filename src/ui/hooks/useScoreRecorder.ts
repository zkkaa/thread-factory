import { useEffect } from 'react';
import type { SimulationController } from '../../controller/SimulationController';
import type { ScoreboardStore } from '../../progress/scoreboardStore';
import { startScoreRecorder } from '../scoreRecorder';

/**
 * Memasang pencatat skor selama `enabled` bernilai true. AppShell hanya
 * mengaktifkannya di Arena kampanye, karena Sandbox boleh mengubah parameter
 * level sehingga rekornya tidak adil dibandingkan.
 */
export function useScoreRecorder(
  controller: SimulationController,
  store: ScoreboardStore,
  enabled: boolean,
): void {
  useEffect(
    () => (enabled ? startScoreRecorder(controller, store) : undefined),
    [controller, store, enabled],
  );
}