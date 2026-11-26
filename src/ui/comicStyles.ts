// Kelas Tailwind bersama untuk elemen bergaya komik (tombol, input, fokus).
// Dipakai laci Parameter dan perombakan HUD berikutnya. Heks #0b1f3a sama
// dengan token navy-900 (nilai arbitrer tidak bisa membaca token tema).

/** Garis fokus gelap: terlihat jelas di atas kartu krem. */
export const COMIC_FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-700';

/** Tombol bulat kuning, mis. tombol kurang dan tambah. */
export const COMIC_ROUND_BUTTON = `grid h-7 w-7 place-items-center rounded-full border-[3px] border-navy-900 bg-sun-400 text-base font-black leading-none text-navy-900 shadow-[2px_2px_0_#0b1f3a] enabled:hover:bg-sun-500 enabled:active:translate-x-px enabled:active:translate-y-px disabled:cursor-not-allowed disabled:bg-ink-300 disabled:opacity-60 ${COMIC_FOCUS}`;

/** Tombol kecil putih berbentuk pil, mis. Lipat dan Buka. */
export const COMIC_PILL_BUTTON = `rounded-lg border-[3px] border-navy-900 bg-white px-2.5 py-0.5 text-[11px] font-black text-navy-900 shadow-[2px_2px_0_#0b1f3a] hover:bg-sun-400 ${COMIC_FOCUS}`;

/** Tombol stiker oranye yang sedikit miring. */
export const COMIC_STICKER_BUTTON = `-rotate-2 self-start rounded-lg border-[3px] border-navy-900 bg-ember-500 px-3 py-1.5 text-xs font-black text-navy-900 shadow-[3px_3px_0_#0b1f3a] hover:bg-sun-400 enabled:active:translate-x-px enabled:active:translate-y-px ${COMIC_FOCUS}`;

/** Kotak pilihan (select) di atas kartu krem. */
export const COMIC_FIELD = `rounded-lg border-[3px] border-navy-900 bg-white px-2 py-1 text-sm font-bold text-navy-900 ${COMIC_FOCUS}`;
