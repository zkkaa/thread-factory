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
 * Total barang yang diambil dari ban selama level, dihitung dari program
 * (jumlah TAKE_ITEM dikali repeat). Null bila level tanpa ban atau tanpa
 * pengambilan. Hanya untuk teks tampilan; penilaian tetap di `evaluateLevel`.
 */
function totalTakenItems(level: LevelDefinition): number | null {
  if (level.buffers === undefined || Object.keys(level.buffers).length === 0) {
    return null;
  }
  const total = level.threads.reduce((sum, thread) => {
    const takes = thread.program.filter((ins) => ins.op === 'TAKE_ITEM').length;
    return sum + takes * (thread.repeat ?? 1);
  }, 0);
  return total > 0 ? total : null;
}

/**
 * Menyusun ringkasan misi untuk chip Misi dari data level. Angkanya langsung
 * dari `goal`, jadi level baru otomatis tampil benar tanpa mengubah UI. Aturan
 * penilaian sendiri tetap di controller (`evaluateLevel`); ini hanya teks.
 * Level berarea (mis. aula Level 1-3) menyebut bentrok, level berban
 * (Level 2-1) menyebut jumlah barang, selain itu variabel target.
 */
export function deriveMission(level: LevelDefinition): MissionSummary {
  const { target, stars } = level.goal;
  const area = areaOf(level);
  const items = area === null ? totalTakenItems(level) : null;

  let targetText: string;
  let correctText: string;
  if (area !== null) {
    targetText = `tanpa bentrok di ${area.name} (kapasitas ${area.capacity})`;
    correctText = `Benar: semua robot selesai tanpa bentrok di ${area.name}.`;
  } else if (items !== null) {
    targetText = `kirim ${items} barang ke pengepak tanpa overflow dan underflow`;
    correctText = `Benar: ${items} barang sampai ke pengepak, tidak ada yang jatuh atau terambil dari ban kosong.`;
  } else {
    targetText = `${target.variable} = ${target.value}`;
    correctText = 'Benar: semua robot selesai dan targetnya tercapai.';
  }

  return {
    targetText,
    stars: [
      { stars: 1, text: correctText },
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