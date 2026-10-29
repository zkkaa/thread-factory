import type { MandorMood } from '../levels/types';

/** Jalur gambar potret per ekspresi, relatif terhadap halaman; null = belum ada. */
export type PortraitSources = Record<MandorMood, string | null>;

/**
 * Potret Pak Mandor (U-074). Isi jalurnya, mis. 'assets/characters/mandor-senang.png',
 * setelah gambarnya ada di public/assets/characters/ dan tercatat di
 * docs/ASSETS.md serta docs/AI_USAGE.md. Ekspresi tanpa gambar memakai
 * 'netral'; bila itu pun kosong, tampil placeholder.
 */
export const MANDOR_PORTRAITS: PortraitSources = {
  netral: 'assets/characters/mandor-netral.png',
  senang: 'assets/characters/mandor-senang.png',
  sedih: 'assets/characters/mandor-sedih.png',
  berpikir: 'assets/characters/mandor-berpikir.png',
};

/** Avatar kepala (dipotong dari potret netral) untuk ikon tombol petunjuk. */
export const MANDOR_AVATAR = 'assets/characters/mandor-avatar.png';

/** Jalur gambar untuk `mood`, dengan cadangan ke 'netral'; null bila tidak ada. */
export function portraitSrcFor(
  mood: MandorMood,
  sources: PortraitSources = MANDOR_PORTRAITS,
): string | null {
  return sources[mood] ?? sources.netral;
}
