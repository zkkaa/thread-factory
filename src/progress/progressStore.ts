import {
  type KeyValueStorage,
  safeGetItem,
  safeRemoveItem,
  safeSetItem,
} from './storage';

export type Stars = 0 | 1 | 2 | 3;

export interface LevelProgress {
  bestStars: Stars;
  cleared: boolean;
}

export interface ProgressData {
  version: 1;
  levels: Record<string, LevelProgress>;
}

export const PROGRESS_KEY = 'threadfactory:progress:v1';

function emptyProgress(): ProgressData {
  return { version: 1, levels: {} };
}

function isStars(value: unknown): value is Stars {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

/**
 * Membaca data mentah dari penyimpanan. Apa pun yang rusak, bukan JSON, atau
 * berversi asing menghasilkan data awal (progres kosong), bukan error.
 */
export function parseProgress(raw: string | null): ProgressData {
  if (raw === null) return emptyProgress();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return emptyProgress();
    const candidate = parsed as { version?: unknown; levels?: unknown };
    if (candidate.version !== 1) return emptyProgress();
    if (
      typeof candidate.levels !== 'object' ||
      candidate.levels === null ||
      Array.isArray(candidate.levels)
    ) {
      return emptyProgress();
    }
    const levels: Record<string, LevelProgress> = {};
    for (const [id, entry] of Object.entries(
      candidate.levels as Record<string, unknown>,
    )) {
      if (typeof entry !== 'object' || entry === null) return emptyProgress();
      const item = entry as { bestStars?: unknown; cleared?: unknown };
      if (!isStars(item.bestStars) || typeof item.cleared !== 'boolean') {
        return emptyProgress();
      }
      levels[id] = { bestStars: item.bestStars, cleared: item.cleared };
    }
    return { version: 1, levels };
  } catch {
    return emptyProgress();
  }
}

/** Apakah level sudah selesai (minimal 1 bintang)? */
export function isLevelCleared(
  data: Readonly<ProgressData>,
  levelId: string,
): boolean {
  return data.levels[levelId]?.cleared === true;
}

/** Bintang terbaik level; 0 bila belum pernah selesai. */
export function getBestStars(
  data: Readonly<ProgressData>,
  levelId: string,
): Stars {
  return data.levels[levelId]?.bestStars ?? 0;
}

/** Jumlah bintang terbaik dari sekumpulan level (untuk ringkasan modul). */
export function totalStars(
  data: Readonly<ProgressData>,
  levelIds: readonly string[],
): number {
  return levelIds.reduce((sum, id) => sum + getBestStars(data, id), 0);
}

/**
 * Penyimpan progres kampanye. State di memori selalu benar; penyimpanan hanya
 * cadangan, jadi kegagalan menyimpan tidak mengganggu permainan.
 */
export class ProgressStore {
  private state: ProgressData;
  private readonly storage: KeyValueStorage;
  private readonly listeners = new Set<() => void>();

  constructor(storage: KeyValueStorage) {
    this.storage = storage;
    this.state = parseProgress(safeGetItem(storage, PROGRESS_KEY));
  }

  /**
   * Data saat ini. Objeknya baru hanya bila ada perubahan, sehingga aman untuk
   * useSyncExternalStore. Berupa properti panah agar bisa dioper langsung.
   */
  getState = (): Readonly<ProgressData> => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * Mencatat hasil level. Bintang hanya naik (tidak pernah turun), dan nilai
   * yang bukan 1, 2, atau 3 diabaikan. Level dianggap selesai mulai 1 bintang.
   */
  record(levelId: string, stars: number): void {
    if (!isStars(stars) || stars === 0) return;
    const previous = this.state.levels[levelId];
    if (previous !== undefined && previous.bestStars >= stars) return;
    this.commit({
      version: 1,
      levels: {
        ...this.state.levels,
        [levelId]: { bestStars: stars, cleared: true },
      },
    });
  }

  /** Menghapus seluruh progres (UI wajib meminta konfirmasi lebih dulu). */
  reset(): void {
    safeRemoveItem(this.storage, PROGRESS_KEY);
    if (Object.keys(this.state.levels).length === 0) return;
    this.state = emptyProgress();
    this.notify();
  }

  private commit(next: ProgressData): void {
    this.state = next;
    safeSetItem(this.storage, PROGRESS_KEY, JSON.stringify(next));
    this.notify();
  }

  private notify(): void {
    for (const listener of [...this.listeners]) listener();
  }
}
