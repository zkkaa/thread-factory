import type { TabDef } from './catatan';

export type SettingsTabId = 'umum' | 'skor' | 'kredit';

export const DEFAULT_SETTINGS_TAB: SettingsTabId = 'umum';

export const SETTINGS_TABS: readonly TabDef<SettingsTabId>[] = [
  { id: 'umum', label: 'Umum', glyph: 'speaker', color: 'bg-sun-400' },
  { id: 'skor', label: 'Papan Skor', glyph: 'trophy', color: 'bg-[#b99be8]' },
  { id: 'kredit', label: 'Kredit', glyph: 'star', color: 'bg-[#b5c98a]' },
];

/** Ucapan Pak Mandor di gelembung, menurut tab yang sedang dibuka. */
export function mandorSays(tab: SettingsTabId, volumePercent: number): string {
  switch (tab) {
    case 'umum':
      return volumePercent === 0
        ? 'Suaranya dimatikan? Sepi amat!'
        : 'Atur suara dan mode demo di sini, ya!';
    case 'skor':
      return 'Ini rekor terbaikmu. Berani memecahkannya?';
    case 'kredit':
      return 'Terima kasih untuk semua yang membantu pabrik ini!';
  }
}
