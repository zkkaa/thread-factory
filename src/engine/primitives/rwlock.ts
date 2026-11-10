import type { ThreadId } from '../types';

/** Kebijakan pembagian akses (PRD Level 2-2). */
export type RwPolicy = 'reader' | 'writer' | 'fair';
export type RwMode = 'read' | 'write';

export interface RwWaiter {
  thread: ThreadId;
  mode: RwMode;
}

export interface RwLockSnapshot {
  id: string;
  policy: RwPolicy;
  readers: ThreadId[];
  writer: ThreadId | null;
  queue: RwWaiter[];
}

/**
 * Kunci banyak-pembaca/satu-penulis (Readers-Writers, Level 2-2).
 * Banyak pembaca boleh bersamaan; penulis harus sendirian. Kebijakan menentukan
 * siapa didahulukan saat ada yang menunggu:
 * - reader: pembaca baru boleh masuk selama tidak ada penulis AKTIF, sehingga
 *   penulis bisa kelaparan (starvation);
 * - writer: bila ada penulis menunggu, pembaca baru antre di belakangnya;
 * - fair: satu antrean FIFO; pembaca berurutan di depan masuk bersamaan.
 * Seperti Mutex, thread yang dibangunkan langsung menjadi pemegang (handoff),
 * jadi antrean tidak pernah dilangkahi secara diam-diam.
 */
export class RwLock {
  private readers = new Set<ThreadId>();
  private writer: ThreadId | null = null;
  private queue: RwWaiter[] = [];

  constructor(
    readonly id: string,
    readonly policy: RwPolicy,
  ) {}

  /** @returns true bila langsung masuk; false bila harus antre (diblokir). */
  acquireRead(thread: ThreadId): boolean {
    this.assertIdle(thread);
    if (this.writer === null && this.canReaderJoin()) {
      this.readers.add(thread);
      return true;
    }
    this.queue.push({ thread, mode: 'read' });
    return false;
  }

  /** @returns true bila langsung masuk; false bila harus antre (diblokir). */
  acquireWrite(thread: ThreadId): boolean {
    this.assertIdle(thread);
    if (
      this.writer === null &&
      this.readers.size === 0 &&
      this.queue.length === 0
    ) {
      this.writer = thread;
      return true;
    }
    this.queue.push({ thread, mode: 'write' });
    return false;
  }

  /** @returns thread yang dibangunkan (sudah menjadi pemegang), urut antrean. */
  releaseRead(thread: ThreadId): ThreadId[] {
    if (!this.readers.delete(thread)) {
      throw new Error(
        `Thread "${thread}" bukan pembaca aktif di "${this.id}" (RW_RELEASE_READ salah)`,
      );
    }
    return this.dispatch();
  }

  /** @returns thread yang dibangunkan (sudah menjadi pemegang), urut antrean. */
  releaseWrite(thread: ThreadId): ThreadId[] {
    if (this.writer !== thread) {
      throw new Error(
        `Thread "${thread}" bukan penulis aktif di "${this.id}" (RW_RELEASE_WRITE salah)`,
      );
    }
    this.writer = null;
    return this.dispatch();
  }

  snapshot(): RwLockSnapshot {
    return {
      id: this.id,
      policy: this.policy,
      readers: [...this.readers],
      writer: this.writer,
      queue: this.queue.map((waiter) => ({ ...waiter })),
    };
  }

  private assertIdle(thread: ThreadId): void {
    if (
      this.readers.has(thread) ||
      this.writer === thread ||
      this.queue.some((waiter) => waiter.thread === thread)
    ) {
      throw new Error(
        `Thread "${thread}" sudah memegang atau mengantre di "${this.id}"`,
      );
    }
  }

  /** Bolehkah pembaca baru masuk (dengan asumsi tidak ada penulis aktif)? */
  private canReaderJoin(): boolean {
    if (this.policy === 'reader') return true;
    if (this.policy === 'writer') {
      return !this.queue.some((waiter) => waiter.mode === 'write');
    }
    return this.queue.length === 0;
  }

  /** Menjadikan penulis terdepan di antrean sebagai pemegang bila tidak ada pembaca. */
  private admitFirstWriter(granted: ThreadId[]): void {
    if (this.readers.size > 0) return;
    const index = this.queue.findIndex((waiter) => waiter.mode === 'write');
    const waiter = this.queue[index];
    if (waiter === undefined) return;
    this.queue.splice(index, 1);
    this.writer = waiter.thread;
    granted.push(waiter.thread);
  }

  /** Membagikan kunci kepada yang menunggu menurut kebijakan. */
  private dispatch(): ThreadId[] {
    const granted: ThreadId[] = [];
    if (this.writer !== null) return granted;

    const admitReaders = (waiters: RwWaiter[]): void => {
      for (const waiter of waiters) {
        this.readers.add(waiter.thread);
        granted.push(waiter.thread);
      }
    };

    if (this.policy === 'reader') {
      const waitingReaders = this.queue.filter((w) => w.mode === 'read');
      if (waitingReaders.length > 0) {
        admitReaders(waitingReaders);
        this.queue = this.queue.filter((w) => w.mode === 'write');
      } else {
        this.admitFirstWriter(granted);
      }
      return granted;
    }

    if (this.policy === 'writer') {
      if (this.queue.some((w) => w.mode === 'write')) {
        this.admitFirstWriter(granted);
      } else {
        admitReaders(this.queue);
        this.queue = [];
      }
      return granted;
    }

    // fair: layani dari depan antrean; berhenti di penulis yang belum boleh masuk.
    for (;;) {
      const head = this.queue[0];
      if (head === undefined) break;
      if (head.mode === 'read') {
        this.queue.shift();
        admitReaders([head]);
        continue;
      }
      this.admitFirstWriter(granted);
      break;
    }
    return granted;
  }
}
