import type { MutexSnapshot, ThreadId } from '../types';

/**
 * Mutex (pintu dengan satu kunci): hanya satu thread yang boleh memilikinya.
 * Thread lain yang meminta antre secara FIFO.
 *
 * Kelas ini hanya mengelola KEPEMILIKAN dan ANTREAN. Mengubah state thread
 * (WAITING/READY) dan memancarkan event dilakukan oleh thread.ts.
 *
 * Aturan serah-terima (handoff): saat pemilik melepas mutex dan ada yang
 * antre, kepemilikan LANGSUNG pindah ke thread terdepan. Thread yang
 * dibangunkan sudah berstatus pemilik, tidak perlu berebut lagi, sehingga
 * urutan FIFO selalu terjaga.
 */
export class Mutex {
  private owner: ThreadId | null = null;
  private queue: ThreadId[] = [];

  constructor(readonly id: string) {}

  /**
   * Thread `thread` meminta mutex.
   * @returns true bila langsung memperoleh; false bila harus antre (diblokir).
   */
  lock(thread: ThreadId): boolean {
    if (this.owner === thread) {
      // Mutex ini tidak rekursif: meminta ulang oleh pemilik = menunggu diri sendiri selamanya.
      throw new Error(
        `Thread "${thread}" meminta mutex "${this.id}" yang sudah dipegangnya (mutex tidak rekursif)`,
      );
    }
    if (this.queue.includes(thread)) {
      throw new Error(
        `Thread "${thread}" sudah mengantre di mutex "${this.id}"`,
      );
    }
    if (this.owner === null) {
      this.owner = thread;
      return true;
    }
    this.queue.push(thread);
    return false;
  }

  /**
   * Pemilik melepas mutex.
   * @returns id thread terdepan yang kini menjadi pemilik baru, atau null
   *          bila tidak ada yang antre.
   * @throws Error bila `thread` bukan pemilik saat ini.
   */
  unlock(thread: ThreadId): ThreadId | null {
    if (this.owner !== thread) {
      const holder =
        this.owner === null ? 'tidak ada (mutex bebas)' : `"${this.owner}"`;
      throw new Error(
        `Thread "${thread}" mencoba UNLOCK mutex "${this.id}" yang bukan miliknya (pemilik: ${holder})`,
      );
    }
    const next = this.queue.shift() ?? null;
    this.owner = next;
    return next;
  }

  /** Apakah `thread` sedang memegang mutex ini. */
  isOwnedBy(thread: ThreadId): boolean {
    return this.owner === thread;
  }

  /** Salinan keadaan untuk Snapshot. */
  snapshot(): MutexSnapshot {
    return { id: this.id, owner: this.owner, queue: [...this.queue] };
  }
}
