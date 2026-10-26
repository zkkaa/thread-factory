import { type KeyValueStorage, safeGetItem, safeSetItem } from './storage';

export interface SettingsData {
  version: 1;
  /** Volume suara, 0 sampai 1. */
  volume: number;
  /** Mematikan efek animasi berlebihan; tidak mengubah logika simulasi. */
  reduceMotion: boolean;
  /** Membuka semua level untuk dosen atau penguji. */
  demoMode: boolean;
}

export type SettingsPatch = Partial<Omit<SettingsData, 'version'>>;

export const SETTINGS_KEY = 'threadfactory:settings:v1';

export const DEFAULT_SETTINGS: SettingsData = {
  version: 1,
  volume: 0.7,
  reduceMotion: false,
  demoMode: false,
};

function clampVolume(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Data rusak, bukan JSON, atau berversi asing menghasilkan pengaturan awal. */
export function parseSettings(raw: string | null): SettingsData {
  if (raw === null) return { ...DEFAULT_SETTINGS };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return { ...DEFAULT_SETTINGS };
    }
    const candidate = parsed as {
      version?: unknown;
      volume?: unknown;
      reduceMotion?: unknown;
      demoMode?: unknown;
    };
    if (
      candidate.version !== 1 ||
      typeof candidate.volume !== 'number' ||
      !Number.isFinite(candidate.volume) ||
      typeof candidate.reduceMotion !== 'boolean' ||
      typeof candidate.demoMode !== 'boolean'
    ) {
      return { ...DEFAULT_SETTINGS };
    }
    return {
      version: 1,
      volume: clampVolume(candidate.volume),
      reduceMotion: candidate.reduceMotion,
      demoMode: candidate.demoMode,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** Penyimpan pengaturan pemain; cara kerjanya sama dengan ProgressStore. */
export class SettingsStore {
  private state: SettingsData;
  private readonly storage: KeyValueStorage;
  private readonly listeners = new Set<() => void>();

  constructor(storage: KeyValueStorage) {
    this.storage = storage;
    this.state = parseSettings(safeGetItem(storage, SETTINGS_KEY));
  }

  getState = (): Readonly<SettingsData> => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * Mengubah satu atau lebih pengaturan. Volume dibatasi 0 sampai 1, dan nilai
   * yang bukan angka diabaikan. Tidak ada notifikasi bila tidak ada perubahan.
   */
  update(patch: SettingsPatch): void {
    const volume =
      patch.volume !== undefined && Number.isFinite(patch.volume)
        ? clampVolume(patch.volume)
        : this.state.volume;
    const next: SettingsData = {
      version: 1,
      volume,
      reduceMotion: patch.reduceMotion ?? this.state.reduceMotion,
      demoMode: patch.demoMode ?? this.state.demoMode,
    };
    if (
      next.volume === this.state.volume &&
      next.reduceMotion === this.state.reduceMotion &&
      next.demoMode === this.state.demoMode
    ) {
      return;
    }
    this.state = next;
    safeSetItem(this.storage, SETTINGS_KEY, JSON.stringify(next));
    for (const listener of [...this.listeners]) listener();
  }
}
