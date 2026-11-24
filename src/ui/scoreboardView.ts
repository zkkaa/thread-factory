import {
  parseGroupKey,
  type ScoreboardData,
  type ScoreEntry,
} from '../progress/scoreboardStore';

export interface ScoreRow {
  rank: number;
  stars: string;
  ticks: number;
  waitTicks: number;
  date: string;
}

export interface SeedBoard {
  seed: number;
  rows: ScoreRow[];
}

export interface LevelBoard {
  levelId: string;
  title: string;
  seeds: SeedBoard[];
}

/** Bintang ditulis dengan kata, bukan hanya ikon. */
export function starsLabel(stars: ScoreEntry['stars']): string {
  return stars === null ? 'Tanpa bintang' : `${stars} bintang`;
}

/**
 * Menyusun data papan skor untuk ditampilkan: menurut urutan level, lalu seed
 * naik. Level tanpa rekor dan level yang tidak ada di daftar dilewati.
 * Fungsi murni.
 */
export function buildScoreboard(
  data: Readonly<ScoreboardData>,
  levels: readonly { id: string; title: string }[],
): LevelBoard[] {
  const boards: LevelBoard[] = [];
  for (const level of levels) {
    const seeds: SeedBoard[] = [];
    for (const [key, entries] of Object.entries(data.groups)) {
      const parsed = parseGroupKey(key);
      if (parsed === null || parsed.levelId !== level.id) continue;
      if (entries.length === 0) continue;
      seeds.push({
        seed: parsed.seed,
        rows: entries.map((entry, index) => ({
          rank: index + 1,
          stars: starsLabel(entry.stars),
          ticks: entry.ticks,
          waitTicks: entry.waitTicks,
          date: entry.date.slice(0, 10),
        })),
      });
    }
    if (seeds.length === 0) continue;
    seeds.sort((a, b) => a.seed - b.seed);
    boards.push({ levelId: level.id, title: level.title, seeds });
  }
  return boards;
}
