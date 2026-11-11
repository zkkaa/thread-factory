import type { Snapshot, ThreadId } from './types';

/**
 * Sisa "kesabaran" thread sebagai pecahan 0..1 (1 = baru mulai menunggu atau
 * tidak menunggu, 0 = sudah mencapai ambang starvation). Dipakai bar kesabaran
 * writer di Level 2-2. Seperti `batteryLevel`: fungsi murni, tampilan hanya
 * menggambar angka ini dan tidak menghitung apa pun sendiri.
 */
export function patienceLevel(
  waitStreak: number,
  thresholdTicks: number,
): number {
  if (!(thresholdTicks > 0)) {
    throw new Error(
      `thresholdTicks harus lebih dari 0, diterima: ${thresholdTicks}`,
    );
  }
  const used = Math.max(0, waitStreak) / thresholdTicks;
  return Math.min(1, Math.max(0, 1 - used));
}

/**
 * Thread yang pernah menunggu terus-menerus minimal `starvationTicks` tick
 * (diukur dari rentetan terpanjang, jadi tetap tercatat walau sudah dibangunkan).
 * Daftar kosong bila deteksi tidak dipakai (ambang tidak diatur) atau snapshot
 * belum memuat data rentetan. Urutan mengikuti urutan thread di snapshot.
 */
export function starvedThreads(snapshot: Readonly<Snapshot>): ThreadId[] {
  const threshold = snapshot.starvationTicks;
  const peaks = snapshot.peakWaitStreaks;
  if (threshold === null || threshold === undefined || peaks === undefined) {
    return [];
  }
  return snapshot.threads
    .filter((thread) => (peaks[thread.id] ?? 0) >= threshold)
    .map((thread) => thread.id);
}
