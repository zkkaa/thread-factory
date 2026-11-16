import type { Stars } from './progressStore';
import {
  type KeyValueStorage,
  safeGetItem,
  safeRemoveItem,
  safeSetItem,
} from './storage';

/** Satu rekor: hasil benar pada satu level dan seed. */
export interface ScoreEntry {
  /** null bila seed bukan seed tutorial (bintang tidak dinilai). */
  stars: Stars | null;
  ticks: number;
  /** Total waktu tunggu semua robot. */
  waitTicks: number;
  /** Tanggal ISO saat rekor dicatat. */
  date: string;
}

export interface ScoreboardData {
  version: 1;
  /** Kunci: `levelId|seed` (lihat groupKey). Isi: rekor terbaik, sudah terurut. */
  groups: Record<string, ScoreEntry[]>;
}

export const SCOREBOARD_KEY = 'threadfactory:scoreboard:v1';
export const MAX_ENTRIES_PER_GROUP = 5;
/** Batas kelompok agar penyimpanan tidak membengkak oleh seed acak. */
export const MAX_GROUPS = 200;

export interface ScoreInput {
  stars: Stars | null;
  ticks: number;
  waitTicks: number;
}

function emptyScoreboard(): ScoreboardData {
  return { version: 1, groups: {} };
}

export function groupKey(levelId: string, seed: number): string {
  return `${levelId}|${seed}`;
}

/** Membalik groupKey; null bila bentuknya salah. */
export function parseGroupKey(
  key: string,
): { levelId: string; seed: number } | null {
  const cut = key.lastIndexOf('|');
  if (cut <= 0) return null;
  const seedText = key.slice(cut + 1);
  if (!/^-?\d+$/.test(seedText)) return null;
  return { levelId: key.slice(0, cut), seed: Number(seedText) };
}

function isNonNegativeInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isStarsOrNull(value: unknown): value is Stars | null {
  return value === null || value === 0 || value === 1 || value === 2 || value === 3;
}

/**
 * Urutan peringkat: bintang lebih banyak, tick lebih sedikit, tunggu lebih
 * sedikit, lalu yang lebih dulu tercatat. Negatif berarti `a` lebih baik.
 */
export function compareEntries(a: ScoreEntry, b: ScoreEntry): number {
  return (
    (b.stars ?? 0) - (a.stars ?? 0) ||
    a.ticks - b.ticks ||
    a.waitTicks - b.waitTicks ||
    a.date.localeCompare(b.date)
  );
}

/** Salinan terurut menurut peringkat; masukan tidak diubah. */
export function rankEntries(entries: readonly ScoreEntry[]): ScoreEntry[] {
  return [...entries].sort(compareEntries);
}

function parseEntry(value: unknown): ScoreEntry | null {
  if (typeof value !== 'object' || value === null) return null;
  const item = value as Record<string, unknown>;
  if (
    !isStarsOrNull(item.stars) ||
    !isNonNegativeInt(item.ticks) ||
    !isNonNegativeInt(item.waitTicks) ||
    typeof item.date !== 'string'
  ) {
    return null;
  }
  return {
    stars: item.stars,
    ticks: item.ticks,
    waitTicks: item.waitTicks,
    date: item.date,
  };
}

/**
 * Membaca data mentah. Apa pun yang rusak, bukan JSON, atau berversi asing
 * menghasilkan papan kosong, bukan error.
 */
export function parseScoreboard(raw: string | null): ScoreboardData {
  if (raw === null) return emptyScoreboard();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return emptyScoreboard();
    const candidate = parsed as { version?: unknown; groups?: unknown };
    if (candidate.version !== 1) return emptyScoreboard();
    if (
      typeof candidate.groups !== 'object' ||
      candidate.groups === null ||
      Array.isArray(candidate.groups)
    ) {
      return emptyScoreboard();
    }
    const groups: Record<string, ScoreEntry[]> = {};
    for (const [key, list] of Object.entries(
      candidate.groups as Record<string, unknown>,
    )) {
      if (parseGroupKey(key) === null || !Array.isArray(list)) {
        return emptyScoreboard();
      }
      const entries: ScoreEntry[] = [];
      for (const item of list) {
        const entry = parseEntry(item);
        if (entry === null) return emptyScoreboard();
        entries.push(entry);
      }
      groups[key] = rankEntries(entries).slice(0, MAX_ENTRIES_PER_GROUP);
    }
    return { version: 1, groups };
  } catch {
    return emptyScoreboard();
  }
}

/**
 * Penyimpan papan skor lokal. State di memori selalu benar; penyimpanan hanya
 * cadangan, jadi kegagalan menyimpan tidak mengganggu permainan.
 */
export class ScoreboardStore {
  private state: ScoreboardData;
  private readonly storage: KeyValueStorage;
  private readonly now: () => number;
  private readonly listeners = new Set<() => void>();

  constructor(storage: KeyValueStorage, now: () => number = Date.now) {
    this.storage = storage;
    this.now = now;
    this.state = parseScoreboard(safeGetItem(storage, SCOREBOARD_KEY));
  }

  /** Objeknya baru hanya bila ada perubahan (aman untuk useSyncExternalStore). */
  getState = (): Readonly<ScoreboardData> => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Rekor terbaik satu level dan seed, sudah terurut (kosong bila belum ada). */
  top(levelId: string, seed: number): readonly ScoreEntry[] {
    return this.state.groups[groupKey(levelId, seed)] ?? [];
  }

  /**
   * Mencatat hasil yang benar. Mengembalikan true bila masuk daftar terbaik.
   * Masukan tidak valid, hasil yang sama persis dengan rekor yang ada, dan
   * hasil di luar lima terbaik diabaikan.
   */
  record(levelId: string, seed: number, input: ScoreInput): boolean {
    if (
      !Number.isInteger(seed) ||
      !isNonNegativeInt(input.ticks) ||
      !isNonNegativeInt(input.waitTicks) ||
      !isStarsOrNull(input.stars)
    ) {
      return false;
    }
    const key = groupKey(levelId, seed);
    const existing = this.state.groups[key];
    if (existing === undefined && Object.keys(this.state.groups).length >= MAX_GROUPS) {
      return false;
    }
    const group = existing ?? [];
    const duplicate = group.some(
      (entry) =>
        entry.stars === input.stars &&
        entry.ticks === input.ticks &&
        entry.waitTicks === input.waitTicks,
    );
    if (duplicate) return false;

    const entry: ScoreEntry = {
      stars: input.stars,
      ticks: input.ticks,
      waitTicks: input.waitTicks,
      date: new Date(this.now()).toISOString(),
    };
    const ranked = rankEntries([...group, entry]).slice(0, MAX_ENTRIES_PER_GROUP);
    if (!ranked.includes(entry)) return false;

    this.commit({ version: 1, groups: { ...this.state.groups, [key]: ranked } });
    return true;
  }

  /** Menghapus seluruh papan skor. */
  reset(): void {
    safeRemoveItem(this.storage, SCOREBOARD_KEY);
    if (Object.keys(this.state.groups).length === 0) return;
    this.state = emptyScoreboard();
    this.notify();
  }

  private commit(next: ScoreboardData): void {
    this.state = next;
    safeSetItem(this.storage, SCOREBOARD_KEY, JSON.stringify(next));
    this.notify();
  }

  private notify(): void {
    for (const listener of [...this.listeners]) listener();
  }
}