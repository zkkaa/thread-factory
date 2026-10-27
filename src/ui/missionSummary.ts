import type { LevelDefinition } from '../levels/types';

export interface MissionStar {
  /** Jumlah bintang yang didapat dengan memenuhi kriteria ini. */
  stars: 1 | 2 | 3;
  text: string;
}

export interface MissionSummary {
  /** Target utama level, mis. "stok = 10". */
  targetText: string;
  /** Kriteria ★, ★★, ★★★ (urut). */
  stars: MissionStar[];
  /** Catatan bahwa bintang hanya dinilai pada seed tutorial; null bila tidak ada. */
  seedNote: string | null;
}

/**
 * Menyusun ringkasan misi untuk chip Misi dari data level. Angkanya langsung
 * dari `goal`, jadi level baru otomatis tampil benar tanpa mengubah UI. Aturan
 * penilaian sendiri tetap di controller (`evaluateLevel`); ini hanya teks.
 */
export function deriveMission(level: LevelDefinition): MissionSummary {
  const { target, stars } = level.goal;

  return {
    targetText: `${target.variable} = ${target.value}`,
    stars: [
      {
        stars: 1,
        text: 'Benar: semua robot selesai dan targetnya tercapai.',
      },
      {
        stars: 2,
        text: `Cepat: selesai dalam paling lama ${stars.fast} tick.`,
      },
      {
        stars: 3,
        text: `Hemat: total waktu tunggu robot paling banyak ${stars.lowWait} tick.`,
      },
    ],
    seedNote:
      level.tutorialSeed !== undefined
        ? `Bintang hanya dinilai pada seed tutorial (${level.tutorialSeed}).`
        : null,
  };
}
