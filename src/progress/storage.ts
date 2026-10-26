/**
 * Antarmuka penyimpanan sederhana. localStorage memenuhinya, dan tes memakai
 * versi memori. Folder progress/ tidak mengimpor react atau phaser.
 */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Penyimpanan di memori: untuk tes, dan cadangan bila localStorage tidak ada. */
export function createMemoryStorage(): KeyValueStorage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

/**
 * localStorage bila benar-benar bisa dipakai, atau null. Mengakses atau menulis
 * ke localStorage bisa melempar error (mode privat, penyimpanan diblokir), jadi
 * kita mencoba menulis satu kunci percobaan dulu.
 */
export function getBrowserStorage(): KeyValueStorage | null {
  try {
    const storage = globalThis.localStorage;
    if (!storage) return null;
    const probe = 'threadfactory:probe';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

/** Membaca kunci tanpa pernah melempar error. */
export function safeGetItem(
  storage: KeyValueStorage,
  key: string,
): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

/** Menulis kunci; mengembalikan false bila gagal (mis. penyimpanan penuh). */
export function safeSetItem(
  storage: KeyValueStorage,
  key: string,
  value: string,
): boolean {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** Menghapus kunci; mengembalikan false bila gagal. */
export function safeRemoveItem(storage: KeyValueStorage, key: string): boolean {
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
