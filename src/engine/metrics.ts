import { computeFairness } from './fairness';
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
   * Instruksi yang dieksekusi / (cores x tick), antara 0 dan 1. Mengukur
   * seberapa sering core sibuk; core menganggur karena thread menunggu pintu.
   * 0 bila tick masih 0.
   */
  coreUtilization: number;
  /**
   * (nilai seharusnya) - (nilai akhir), tidak pernah negatif.
   * null bila `expected` tidak diberikan, atau bila simulasi belum selesai
   * normal (ada thread yang belum TERMINATED): nilai yang belum final tidak
   * boleh dianggap sebagai pembaruan yang hilang.
   */
  lostUpdates: number | null;
  /** Total tick dengan kejadian kelebihan kapasitas area (bentrok). */
  overloadTicks: number;
  /** Rata-rata utilisasi area berkapasitas (0..1). */
  areaUtilization: number;
  busyWaitTicks: number;
  /** Tick busy waiting per thread (0 bagi thread yang tidak berputar). */
  busyWaitTicksByThread: Record<ThreadId, number>;
  /** Bacaan papan saat sedang ditulis (data setengah jadi), Level 2-2. */
  inconsistentReads: number;
  /** Penulisan papan yang bertabrakan dengan penulis lain, Level 2-2. */
  /** Penulisan papan yang bertabrakan dengan penulis lain, Level 2-2. */
  writeConflicts: number;
  /**
   * Pemerataan giliran antar thread (Level 2-3: jumlah makan per teknisi).
   * Dihitung `computeFairness`; indeks Jain bernilai null bila belum ada
   * thread yang menyelesaikan satu pengulangan pun.
   */
  fairness: ReturnType<typeof computeFairness>;
}
/**
 * Kapasitas baterai bawaan: jumlah tick busy waiting yang menghabiskan baterai
 * robot dari penuh sampai kosong. Level boleh memakai kapasitas lain (T-046).
 */
export const DEFAULT_BATTERY_TICKS = 20;

/**
 * Sisa baterai robot sebagai pecahan 0..1 (1 = penuh, 0 = habis). Baterai
 * hanya terkuras oleh busy waiting: tiap tick `busyWaitTicks` mengurangi
 * 1/`capacityTicks`. Thread yang tidur (WAITING) tidak menguras baterai.
 * Fungsi murni; tampilan (Phaser) hanya menggambar angka ini.
 */
export function batteryLevel(
  busyWaitTicks: number,
  capacityTicks: number = DEFAULT_BATTERY_TICKS,
): number {
  if (!(capacityTicks > 0)) {
    throw new Error(
      `capacityTicks harus lebih dari 0, diterima: ${capacityTicks}`,
    );
  }
  const used = Math.max(0, busyWaitTicks) / capacityTicks;
  return Math.min(1, Math.max(0, 1 - used));
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
  const busyWaitTicksByThread: Record<ThreadId, number> = {};
  let busyWaitTicks = 0;
  for (const t of threads) {
    waitTicksByThread[t.id] = t.waitTicks;
    totalWait += t.waitTicks;
    maxWaitTicks = Math.max(maxWaitTicks, t.waitTicks);
    busyWaitTicksByThread[t.id] = t.busyWaitTicks;
    busyWaitTicks += t.busyWaitTicks;
  }
  const avgWaitTicks = threads.length > 0 ? totalWait / threads.length : 0;
  const coreCapacity = snapshot.cores * snapshot.tick;
  const coreUtilization =
    coreCapacity > 0 ? snapshot.executedInstructions / coreCapacity : 0;

  let lostUpdates: number | null = null;
  if (expected !== undefined) {
    if (
      !Object.prototype.hasOwnProperty.call(
        snapshot.sharedVars,
        expected.variable,
      )
    ) {
      throw new Error(
        `Variabel bersama "${expected.variable}" tidak ada di snapshot`,
      );
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
    coreUtilization,
    lostUpdates,
    overloadTicks: snapshot.overloadTicks ?? 0,
    areaUtilization: snapshot.areaUtilization ?? 0,
    busyWaitTicks,
    busyWaitTicksByThread,
    inconsistentReads: snapshot.inconsistentReadCount,
    writeConflicts: snapshot.writeConflictCount,
    fairness: computeFairness(snapshot),
  };
}
