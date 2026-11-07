import type { BufferSnapshot } from '../types';

/**
 * Ban berjalan berslot terbatas (bounded buffer, Level 2-1).
 *
 * Sengaja TIDAK memblokir: pembatasnya adalah semaphore `empty` dan `full`
 * yang dipasang pemain. Tanpa semaphore, put() pada ban penuh menjadi
 * overflow (barang jatuh, tidak masuk) dan take() pada ban kosong menjadi
 * underflow (tangan meraih kosong); keduanya hanya dihitung.
 */
export class BoundedBuffer {
  private items = 0;
  private overflows = 0;
  private underflows = 0;
  private totalPut = 0;
  private totalTaken = 0;

  constructor(
    readonly id: string,
    readonly capacity: number,
  ) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new Error(
        `Kapasitas ban "${id}" harus bilangan bulat >= 1 (diberikan: ${capacity})`,
      );
    }
  }

  /** Jumlah barang di ban saat ini. */
  get count(): number {
    return this.items;
  }

  /** @returns true bila barang masuk; false bila ban penuh (overflow). */
  put(): boolean {
    if (this.items >= this.capacity) {
      this.overflows += 1;
      return false;
    }
    this.items += 1;
    this.totalPut += 1;
    return true;
  }

  /** @returns true bila barang terambil; false bila ban kosong (underflow). */
  take(): boolean {
    if (this.items <= 0) {
      this.underflows += 1;
      return false;
    }
    this.items -= 1;
    this.totalTaken += 1;
    return true;
  }

  snapshot(): BufferSnapshot {
    return {
      id: this.id,
      capacity: this.capacity,
      items: this.items,
      overflows: this.overflows,
      underflows: this.underflows,
      totalPut: this.totalPut,
      totalTaken: this.totalTaken,
    };
  }
}
