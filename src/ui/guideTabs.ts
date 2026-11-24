import type { TabDef } from './catatan';

export type GuideTabId = 'cara' | 'status' | 'kontrol' | 'glosarium';

export const DEFAULT_GUIDE_TAB: GuideTabId = 'cara';

export const GUIDE_TABS: readonly TabDef<GuideTabId>[] = [
  { id: 'cara', label: 'Cara Main', glyph: 'play', color: 'bg-sun-400' },
  { id: 'status', label: 'Status', glyph: 'robot', color: 'bg-[#8fb4ee]' },
  { id: 'kontrol', label: 'Kontrol', glyph: 'gear', color: 'bg-[#b99be8]' },
  { id: 'glosarium', label: 'Glosarium', glyph: 'book', color: 'bg-[#b5c98a]' },
];

/** Ucapan Pak Mandor di gelembung, menurut tab yang sedang dibuka. */
export function guideMandorSays(tab: GuideTabId): string {
  switch (tab) {
    case 'cara':
      return 'Tiga langkah saja: amati, pasang, jalankan!';
    case 'status':
      return 'Warna saja tidak cukup, baca juga labelnya!';
    case 'kontrol':
      return 'Arahkan kursor ke tombol mana pun untuk melihat tooltipnya.';
    case 'glosarium':
      return 'Lupa istilah? Buka halaman ini kapan saja.';
  }
}
