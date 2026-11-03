import type { ConditionSnapshot, ThreadId } from '../types';

/** Satu thread yang tidur di condition, beserta mutex yang harus diambil lagi saat bangun. */
export interface ConditionWaiter {
  thread: ThreadId;
  mutex: string;
}

/**
 * Condition variable (lampu sinyal): tempat thread tidur sampai ada yang
 * memberi sinyal. Selalu dipakai berpasangan dengan mutex.
 *
 * Kelas ini hanya mengelola ANTREAN TUNGGU (FIFO). Melepas dan mengambil
 * kembali mutex, mengubah state thread, dan memancarkan event dilakukan oleh
 * thread.ts, sama seperti pembagian tugas pada Mutex dan Semaphore.
 *
 * Perilaku sinyal (gaya "Mesa", seperti pthread):
 * - signal/broadcast saat antrean kosong HILANG begitu saja (tidak diingat).
 *   Ini berbeda dengan semaphore yang menyimpan jumlah izin.
 * - Thread yang dibangunkan belum tentu langsung jalan: ia harus mengambil
 *   mutex lagi, dan bisa mengantre di mutex bila masih dipegang pemberi sinyal.
 */
export class Condition {
  private queue: ConditionWaiter[] = [];

  constructor(readonly id: string) {}

  /** Thread `thread` tidur di condition ini; `mutex` adalah mutex yang akan diambil lagi saat bangun. */
  wait(thread: ThreadId, mutex: string): void {
    if (this.queue.some((w) => w.thread === thread)) {
      throw new Error(
        `Thread "${thread}" sudah menunggu di condition "${this.id}"`,
      );
    }
    this.queue.push({ thread, mutex });
  }

  /** Mengeluarkan satu penunggu terdepan, atau null bila antrean kosong (sinyal hilang). */
  signal(): ConditionWaiter | null {
    return this.queue.shift() ?? null;
  }

  /** Mengeluarkan SEMUA penunggu sesuai urutan antre; antrean menjadi kosong. */
  broadcast(): ConditionWaiter[] {
    const all = this.queue;
    this.queue = [];
    return all;
  }

  /** Salinan keadaan untuk Snapshot. */
  snapshot(): ConditionSnapshot {
    return { id: this.id, queue: this.queue.map((w) => w.thread) };
  }
}