import type { LevelDefinition } from '../levels/types';
import { areaOf } from './areaMode';

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
 * Level berarea (mis. aula Level 1-3) menyebut bentrok, bukan variabel target.
 */
export function deriveMission(level: LevelDefinition): MissionSummary {
  const { target, stars } = level.goal;
  const area = areaOf(level);

  return {
    targetText:
      area === null
        ? `${target.variable} = ${target.value}`
        : `tanpa bentrok di ${area.name} (kapasitas ${area.capacity})`,
    stars: [
      {
        stars: 1,
        text:
          area === null
            ? 'Benar: semua robot selesai dan targetnya tercapai.'
            : `Benar: semua robot selesai tanpa bentrok di ${area.name}.`,
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
