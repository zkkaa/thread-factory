import type { ControllerState } from '../controller/SimulationController';
import type { ScoreboardStore } from '../progress/scoreboardStore';

/** Bagian controller yang dibutuhkan pencatat skor (memudahkan tes). */
export interface ScoreSource {
  subscribe(
    listener: (
      state: Pick<ControllerState, 'level' | 'result' | 'seed'>,
    ) => void,
  ): () => void;
}

/**
 * Mencatat rekor setiap kali sebuah level selesai dengan benar, pada seed
 * apa pun. Hasil yang salah tidak dicatat. Setiap objek hasil diproses paling
 * banyak satu kali. Mengembalikan fungsi untuk berhenti berlangganan.
 */
export function startScoreRecorder(
  source: ScoreSource,
  store: ScoreboardStore,
): () => void {
  let handled: object | null = null;
  return source.subscribe(({ level, result, seed }) => {
    if (result === null || result === handled) return;
    handled = result;
    if (level === null || !result.ok) return;
    const waitTicks = Object.values(result.metrics.waitTicksByThread).reduce(
      (sum, value) => sum + value,
      0,
    );
    store.record(level.id, seed, {
      stars: result.stars,
      ticks: result.metrics.tick,
      waitTicks,
    });
  });
}
