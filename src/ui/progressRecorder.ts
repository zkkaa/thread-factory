import type { ControllerState } from '../controller/SimulationController';
import type { ProgressStore } from '../progress/progressStore';

/** Bagian controller yang dibutuhkan pencatat (memudahkan tes dengan sumber palsu). */
export interface RecorderSource {
  subscribe(
    listener: (state: Pick<ControllerState, 'level' | 'result'>) => void,
  ): () => void;
}

/**
 * Mencatat bintang ke ProgressStore setiap kali sebuah level selesai dengan
 * benar dan menghasilkan bintang. Hasil tanpa bintang (seed bukan seed
 * tutorial) dan hasil yang salah tidak dicatat. Setiap objek hasil dicatat
 * paling banyak satu kali; ProgressStore sendiri memastikan bintang tidak
 * pernah turun. Mengembalikan fungsi untuk berhenti berlangganan.
 */
export function startProgressRecorder(
  source: RecorderSource,
  store: ProgressStore,
): () => void {
  let handled: object | null = null;
  return source.subscribe(({ level, result }) => {
    if (result === null || result === handled) return;
    handled = result;
    if (level === null || !result.ok || result.stars === null) return;
    store.record(level.id, result.stars);
  });
}
