import type { SemaphoreSnapshot, ThreadId } from '../types';

/**
 * Counting Semaphore: mengelola sejumlah izin (tokens/permits) dan antrean tunggu FIFO.
 *
 * Sesuai ARCHITECTURE 4.5:
 * Punya `value` dan antrean FIFO. `SEM_WAIT` mengurangi nilai; jika hasilnya negatif,
 * thread menunggu. `SEM_SIGNAL` menambah nilai dan membangunkan satu thread.
 */
export class Semaphore {
  private value: number;
  private queue: ThreadId[] = [];

  constructor(
    readonly id: string,
    initialValue: number,
  ) {
    if (!Number.isInteger(initialValue) || initialValue < 0) {
      throw new Error(
        `Nilai awal semaphore "${id}" harus bilangan bulat non-negatif (diberikan: ${initialValue})`,
      );
    }
    this.value = initialValue;
  }

  /**
   * Thread `thread` meminta satu token.
   * @returns true bila langsung memperoleh token; false bila harus antre (diblokir).
   */
  wait(thread: ThreadId): boolean {
    if (this.queue.includes(thread)) {
      throw new Error(
        `Thread "${thread}" sudah mengantre di semaphore "${this.id}"`,
      );
    }
    this.value -= 1;
    if (this.value < 0) {
      this.queue.push(thread);
      return false;
    }
    return true;
  }

  /**
   * Melepas/mengembalikan satu token dan membangunkan thread terdepan di antrean jika ada.
   * @returns id thread yang dibangunkan, atau null bila tidak ada yang menunggu.
   */
  signal(): ThreadId | null {
    this.value += 1;
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      return next;
    }
    return null;
  }

  /** Salinan keadaan untuk Snapshot. */
  snapshot(): SemaphoreSnapshot {
    return {
      id: this.id,
      value: this.value,
      queue: [...this.queue],
    };
  }
}
