import type { Snapshot, ThreadId } from './types';

/**
 * Nilai akhir yang SEHARUSNYA dimiliki sebuah variabel bersama bila tidak ada
 * pembaruan yang hilang (mis. { variable: 'stok', value: 10 }). Datanya berasal
 * dari invariant level; controller yang meneruskannya ke sini.
 */
export interface ExpectedValue {
  variable: string;
  value: number;
}

export interface Metrics {
  tick: number;
  /** Jumlah pengulangan program yang sudah selesai, dijumlahkan dari semua thread. */
  completedJobs: number;
  /** completedJobs / tick (0 bila tick masih 0). */
  throughput: number;
  /** Total tick berstatus WAITING per thread. */
  waitTicksByThread: Record<ThreadId, number>;
  avgWaitTicks: number;
  maxWaitTicks: number;
  /**
   * (nilai seharusnya) - (nilai akhir), tidak pernah negatif.
   * null bila `expected` tidak diberikan, atau bila simulasi belum selesai
   * normal (ada thread yang belum TERMINATED): nilai yang belum final tidak
   * boleh dianggap sebagai pembaruan yang hilang.
   */
  lostUpdates: number | null;
}

/**
 * Menghitung metrik dari snapshot. Fungsi murni: tidak mengubah masukan dan
 * boleh dipanggil kapan saja (tiap tick untuk tampilan langsung, atau sekali
 * setelah selesai untuk panel hasil).
 */
export function computeMetrics(
  snapshot: Readonly<Snapshot>,
  expected?: ExpectedValue,
): Metrics {
  const threads = snapshot.threads;

  const completedJobs = threads.reduce((sum, t) => sum + t.iteration, 0);
  const throughput = snapshot.tick > 0 ? completedJobs / snapshot.tick : 0;

  const waitTicksByThread: Record<ThreadId, number> = {};
  let totalWait = 0;
  let maxWaitTicks = 0;
  for (const t of threads) {
    waitTicksByThread[t.id] = t.waitTicks;
    totalWait += t.waitTicks;
    maxWaitTicks = Math.max(maxWaitTicks, t.waitTicks);
  }
  const avgWaitTicks = threads.length > 0 ? totalWait / threads.length : 0;

  let lostUpdates: number | null = null;
  if (expected !== undefined) {
    if (!Object.prototype.hasOwnProperty.call(snapshot.sharedVars, expected.variable)) {
      throw new Error(`Variabel bersama "${expected.variable}" tidak ada di snapshot`);
    }
    const allTerminated = threads.every((t) => t.state === 'TERMINATED');
    if (allTerminated) {
      const finalValue = snapshot.sharedVars[expected.variable] as number;
      lostUpdates = Math.max(0, expected.value - finalValue);
    }
  }

  return {
    tick: snapshot.tick,
    completedJobs,
    throughput,
    waitTicksByThread,
    avgWaitTicks,
    maxWaitTicks,
    lostUpdates,
  };
}
