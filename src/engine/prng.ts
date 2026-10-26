export interface Prng {
  /** Bilangan acak pecahan di rentang [0, 1). */
  next(): number;
  /** Bilangan bulat acak di rentang [0, maxExclusive). */
  nextInt(maxExclusive: number): number;
  /** Memilih satu elemen acak dari array tidak kosong. */
  pick<T>(items: readonly T[]): T;
}

/**
 * Mengubah seed menjadi bilangan bulat 32-bit tanpa tanda.
 * Seed harus bilangan hingga (bukan NaN/Infinity); pecahan dibulatkan ke bawah.
 */
export function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) {
    throw new RangeError(`Seed harus bilangan hingga, diterima: ${seed}`);
  }
  return Math.floor(seed) >>> 0;
}

/** Membuat PRNG baru. Seed yang sama selalu menghasilkan urutan yang sama. */
export function createPrng(seed: number): Prng {
  let state = normalizeSeed(seed);

  function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function nextInt(maxExclusive: number): number {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new RangeError(
        `maxExclusive harus bilangan bulat > 0, diterima: ${maxExclusive}`,
      );
    }
    return Math.floor(next() * maxExclusive);
  }

  function pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new RangeError('pick() tidak bisa memilih dari array kosong');
    }
    // nextInt selalu menghasilkan indeks valid (0 .. length-1)
    return items[nextInt(items.length)] as T;
  }

  return { next, nextInt, pick };
}
