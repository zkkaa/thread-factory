import type { CharacterId } from '../levels/characters';
import { HOME_CHARACTER } from '../levels/characters';
import type { MandorMood } from '../levels/types';

/** Jalur gambar potret per ekspresi, relatif terhadap halaman; null = belum ada. */
export type PortraitSources = Record<MandorMood, string | null>;

/** Potret satu karakter: public/assets/characters/<id>/<id>-<ekspresi>.png. */
export function portraitSourcesFor(character: CharacterId): PortraitSources {
  const base = `assets/characters/${character}/${character}`;
  return {
    netral: `${base}-netral.png`,
    senang: `${base}-senang.png`,
    sedih: `${base}-sedih.png`,
    berpikir: `${base}-berpikir.png`,
  };
}

/**
 * Alias sementara untuk kode dan tes lama yang masih memakai nama ini.
 * Menunjuk ke karakter Beranda; hapus setelah semua pemakai pindah.
 */
export const MANDOR_PORTRAITS: PortraitSources =
  portraitSourcesFor(HOME_CHARACTER);

/** Avatar kepala untuk ikon tombol petunjuk (sementara, sampai avatar per karakter diputuskan). */
export const MANDOR_AVATAR = 'assets/characters/mandor-avatar.png';

/** Jalur gambar untuk `mood`, dengan cadangan ke 'netral'; null bila tidak ada. */
export function portraitSrcFor(
  mood: MandorMood,
  sources: PortraitSources = MANDOR_PORTRAITS,
): string | null {
  return sources[mood] ?? sources.netral;
}
