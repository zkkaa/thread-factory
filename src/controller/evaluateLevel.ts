import { computeMetrics, type Metrics } from '../engine/metrics';
import type { Snapshot } from '../engine/types';
import type { LevelDefinition } from '../levels/types';

/** Jumlah bintang: 0 (gagal) sampai 3. */
export type Stars = 0 | 1 | 2 | 3;

/** Hasil akhir satu kali simulasi; dibaca ResultDialog dan MetricsPanel. */
export interface LevelResult {
  /** Lulus: semua robot selesai dan invariant level terpenuhi. */
  readonly ok: boolean;
  /** Penjelasan singkat untuk pemain (dari invariant level). */
  readonly message: string;
  readonly metrics: Metrics;
  /**
   * Bintang berdasarkan ambang di data level. null = tidak dinilai, karena
   * simulasi dijalankan dengan seed selain `tutorialSeed` level (waktu tunggu
   * bergantung seed, jadi bintang hanya adil pada seed yang sama untuk semua pemain).
   */
  readonly stars: Stars | null;
}

const NOT_COMPLETED_MESSAGE =
  'Simulasi berhenti sebelum semua robot selesai (robot saling menunggu atau melewati batas tick).';

/**
 * Menilai snapshot akhir sebuah level. Fungsi murni.
 *
 * Bintang bersifat bertingkat (PRD bagian 10):
 *  - 1 bintang : benar (lulus invariant dan semua robot selesai)
 *  - 2 bintang : benar DAN total tick <= goal.stars.fast
 *  - 3 bintang : 2 bintang DAN total waitTicks <= goal.stars.lowWait
 */
export function evaluateLevel(
  level: LevelDefinition,
  snapshot: Readonly<Snapshot>,
): LevelResult {
  const metrics = computeMetrics(snapshot, level.goal.target);

  const completed = snapshot.threads.every((t) => t.state === 'TERMINATED');
  const verdict = completed
    ? level.goal.invariant(snapshot)
    : { ok: false, message: NOT_COMPLETED_MESSAGE };

  const rated =
    level.tutorialSeed === undefined || snapshot.seed === level.tutorialSeed;
  if (!rated) {
    return { ok: verdict.ok, message: verdict.message, metrics, stars: null };
  }

  let stars: Stars = 0;
  if (verdict.ok) {
    stars = 1;
    if (snapshot.tick <= level.goal.stars.fast) {
      stars = 2;
      const totalWait = Object.values(metrics.waitTicksByThread).reduce((a, b) => a + b, 0);
      if (totalWait <= level.goal.stars.lowWait) stars = 3;
    }
  }
  return { ok: verdict.ok, message: verdict.message, metrics, stars };
}