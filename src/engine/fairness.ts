import type { ThreadId, ThreadSnapshot } from './types';

/** Bagian snapshot yang dibutuhkan; Snapshot penuh otomatis cocok. */
export interface FairnessInput {
  threads: readonly Pick<ThreadSnapshot, 'id' | 'iteration'>[];
}

/** Keadilan pembagian giliran antar thread (PRD 9, Level 2-3: fairness). */
export interface Fairness {
  /** Jumlah makan (pengulangan program yang selesai) per thread. */
  mealsByThread: Record<ThreadId, number>;
  totalMeals: number;
  minMeals: number;
  maxMeals: number;
  /**
   * Indeks Jain, 0..1: (jumlah)^2 / (n x jumlah kuadrat). 1 = semua sama
   * rata. null bila belum ada yang makan (tidak terdefinisi), mis. saat
   * deadlock sejak awal.
   */
  jainIndex: number | null;
  /** Thread yang belum makan sama sekali, padahal thread lain sudah. */
  starved: ThreadId[];
}

/**
 * Menghitung fairness dari snapshot. Fungsi murni.
 * Satu "makan" = satu pengulangan program selesai = `iteration`. Perampasan
 * kunci (preempt) tidak mengurangi hitungan karena rollback hanya mengulang
 * pengulangan yang sedang berjalan.
 */
export function computeFairness(input: FairnessInput): Fairness {
  const mealsByThread: Record<ThreadId, number> = {};
  for (const thread of input.threads) {
    mealsByThread[thread.id] = thread.iteration;
  }

  const counts = Object.values(mealsByThread);
  const totalMeals = counts.reduce((sum, n) => sum + n, 0);
  const minMeals = counts.length === 0 ? 0 : Math.min(...counts);
  const maxMeals = counts.length === 0 ? 0 : Math.max(...counts);

  const squares = counts.reduce((sum, n) => sum + n * n, 0);
  const jainIndex =
    totalMeals === 0
      ? null
      : (totalMeals * totalMeals) / (counts.length * squares);

  const starved =
    maxMeals === 0
      ? []
      : input.threads.filter((t) => t.iteration === 0).map((t) => t.id);

  return { mealsByThread, totalMeals, minMeals, maxMeals, jainIndex, starved };
}
