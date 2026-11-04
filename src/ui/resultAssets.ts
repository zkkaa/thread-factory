/**
 * Gambar hiasan popup hasil (S6). Jalur relatif terhadap halaman, seperti
 * mandorPortraits.ts. Bila null, ResultDialog memakai gambar SVG bawaan,
 * jadi popup tetap tampil walau berkasnya belum ada.
 * Sumber dan lisensi: docs/ASSETS.md dan docs/AI_USAGE.md.
 */
export interface ResultAssetSources {
  ribbonSalah: string | null;
  ribbonBenar: string | null;
  starEmpty: string | null;
  starFull: string | null;
}

export const RESULT_ASSETS: ResultAssetSources = {
  ribbonSalah: 'assets/ui/ribbon-salah.png',
  ribbonBenar: 'assets/ui/ribbon-benar.png',
  starEmpty: 'assets/ui/star-kosong.png',
  starFull: 'assets/ui/star-penuh.png',
};

/** Jalur pita untuk hasil benar atau salah; null bila tidak ada. */
export function ribbonSrc(
  ok: boolean,
  assets: ResultAssetSources = RESULT_ASSETS,
): string | null {
  return ok ? assets.ribbonBenar : assets.ribbonSalah;
}
