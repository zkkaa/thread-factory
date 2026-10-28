/**
 * Kelas animasi yang menghormati pengaturan "kurangi animasi" (CLAUDE.md
 * aturan 11). Dipisah dari komponen supaya bisa dites tanpa browser.
 */

/** Denyut untuk elemen yang perlu disorot; kosong bila animasi dikurangi. */
export function pulseClass(active: boolean, reduceMotion: boolean): string {
  return active && !reduceMotion
    ? 'animate-pulse motion-reduce:animate-none'
    : '';
}

/**
 * Kelas satu bintang. Bintang yang baru muncul (urutan terakhir yang tampil)
 * membesar sebentar; sisanya diam. `shown` = jumlah bintang yang sudah tampil.
 */
export function starClass(
  index: number,
  shown: number,
  reduceMotion: boolean,
): string {
  const base = 'inline-block';
  return index === shown - 1 && !reduceMotion
    ? `${base} animate-star-pop motion-reduce:animate-none`
    : base;
}
