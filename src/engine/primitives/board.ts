import type { BoardSnapshot } from '../types';

/**
 * Papan pengumuman (Readers-Writers, Level 2-2). Penulisan terjadi dalam dua
 * langkah (START lalu END); selama itu isi papan setengah jadi. Pembaca yang
 * membaca di antaranya mendapat data tidak utuh, dan penulis lain yang mulai
 * menulis bersamaan menimbulkan bentrok. Papan hanya MENCATAT kejadian itu;
 * yang mencegahnya adalah RwLock yang dipasang pemain.
 */
export class Board {
  private activeWriters = 0;
  private version = 0;
  private reads = 0;
  private inconsistentReads = 0;
  private writeConflicts = 0;

  constructor(readonly id: string) {}

  /** @returns true bila bacaan utuh; false bila papan sedang ditulis. */
  read(): boolean {
    this.reads += 1;
    if (this.activeWriters > 0) {
      this.inconsistentReads += 1;
      return false;
    }
    return true;
  }

  /** @returns true bila ada penulis lain yang sedang menulis (bentrok). */
  startWrite(): boolean {
    const conflict = this.activeWriters > 0;
    if (conflict) this.writeConflicts += 1;
    this.activeWriters += 1;
    return conflict;
  }

  endWrite(): void {
    if (this.activeWriters === 0) {
      throw new Error(
        `Papan "${this.id}": BOARD_WRITE_END tanpa BOARD_WRITE_START (urutan tulis salah)`,
      );
    }
    this.activeWriters -= 1;
    this.version += 1;
  }

  snapshot(): BoardSnapshot {
    return {
      id: this.id,
      activeWriters: this.activeWriters,
      version: this.version,
      reads: this.reads,
      inconsistentReads: this.inconsistentReads,
      writeConflicts: this.writeConflicts,
    };
  }
}
