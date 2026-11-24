/** Data tata letak papan catatan (clipboard) dan logika tab yang murni. */

/** Rasio lebar : tinggi gambar papan-klip.png. Sesuaikan dengan gambar asli. */
export const BOARD_ASPECT = 1.55;

/** Tinggi layar (rem) yang disisihkan untuk judul di atas papan. */
export const BOARD_RESERVE_REM = 6.5;

/** Bagian lebar layar (vw) yang boleh dipakai papan beserta Pak Mandor. */
export const PAGE_USABLE_VW = 94;

/** Lebar Pak Mandor sebagai kelipatan lebar papan. */
export const MANDOR_WIDTH_RATIO = 0.34;

/** Seberapa jauh Pak Mandor menutupi tepi kanan papan (kelipatan lebar papan). */
export const MANDOR_OVERLAP_RATIO = 0.06;

/** Area kertas di dalam papan, dalam persen dari ukuran papan. */
export const PAPER_INSET = { top: 13, right: 8, bottom: 14, left: 8 } as const;

/**
 * Lebar papan (CSS): papan beserta Pak Mandor harus muat di lebar layar,
 * dan papan harus muat di tinggi layar.
 */
export function boardWidthCss(): string {
  const total = (1 + MANDOR_WIDTH_RATIO - MANDOR_OVERLAP_RATIO).toFixed(3);
  return `min(calc(${PAGE_USABLE_VW}vw / ${total}), calc((100vh - ${BOARD_RESERVE_REM}rem) * ${BOARD_ASPECT}))`;
}

export type TabGlyphName =
  'speaker' | 'bars' | 'trophy' | 'star' | 'play' | 'robot' | 'gear' | 'book';

export interface TabDef<Id extends string> {
  id: Id;
  label: string;
  glyph: TabGlyphName;
  /** Kelas Tailwind untuk warna latar tab. */
  color: string;
}

/**
 * Tab tujuan untuk satu tombol keyboard (panah, Home, End).
 * Mengembalikan null bila tombol itu tidak mengatur tab.
 */
export function moveTab<Id extends string>(
  tabs: readonly TabDef<Id>[],
  current: Id,
  key: string,
): Id | null {
  if (tabs.length === 0) return null;
  const index = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === current),
  );
  switch (key) {
    case 'ArrowRight':
      return tabs[(index + 1) % tabs.length]?.id ?? null;
    case 'ArrowLeft':
      return tabs[(index - 1 + tabs.length) % tabs.length]?.id ?? null;
    case 'Home':
      return tabs[0]?.id ?? null;
    case 'End':
      return tabs[tabs.length - 1]?.id ?? null;
    default:
      return null;
  }
}
