import type { KeyValueStorage } from '../storage';

/** Penyimpanan palsu yang selalu gagal, meniru mode privat atau diblokir. */
export function createBrokenStorage(): KeyValueStorage {
  const fail = (): never => {
    throw new Error('Penyimpanan tidak tersedia');
  };
  return { getItem: fail, setItem: fail, removeItem: fail };
}

/** Penyimpanan yang bisa dibaca tetapi gagal saat menulis (kuota penuh). */
export function createFullStorage(
  initial: Record<string, string> = {},
): KeyValueStorage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: () => {
      throw new Error('Kuota penyimpanan penuh');
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}
