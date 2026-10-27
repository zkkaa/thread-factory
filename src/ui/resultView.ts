import type { LevelResult, Stars } from '../controller/evaluateLevel';
import type { Snapshot } from '../engine/types';
import type { LevelDefinition } from '../levels/types';

export interface ResultView {
  ok: boolean;
  title: string;
  /** Isi gelembung Pak Mandor. */
  quote: string;
  message: string;
  stars: Stars | null;
  /** Catatan bila seed bukan seed tutorial; null bila bintang dinilai. */
  seedNote: string | null;
  criteria: { label: string; met: boolean }[];
  cards: { label: string; value: string }[];
  explanation: string | null;
}

const DEFAULT_TITLES = {
  pass: 'Bagus! Berhasil!',
  fail: 'Waduh, Hasilnya Salah!',
};

/** Mengubah hasil penilaian controller menjadi data tampilan. Tidak menilai ulang. */
export function deriveResultView(
  level: LevelDefinition,
  snapshot: Snapshot,
  result: LevelResult,
): ResultView {
  const { variable, value: target } = level.goal.target;
  const actual = snapshot.sharedVars[variable];
  const actualText = actual === undefined ? '-' : String(actual);
  const totalWait = Object.values(result.metrics.waitTicksByThread).reduce(
    (a, b) => a + b,
    0,
  );
  const { fast, lowWait } = level.goal.stars;
  const efficient = result.ok && result.metrics.tick <= fast;
  const frugal = efficient && totalWait <= lowWait;
  const titles = level.resultTitle ?? DEFAULT_TITLES;

  return {
    ok: result.ok,
    title: result.ok ? titles.pass : titles.fail,
    quote: result.ok
      ? `Hasilnya ${actualText}, sesuai target ${target}.`
      : `Seharusnya ${target}, hasilnya ${actualText}.`,
    message: result.message,
    stars: result.stars,
    seedNote:
      result.stars === null
        ? `Bintang hanya dinilai pada seed tutorial (${level.tutorialSeed ?? '-'}). Seed sekarang: ${snapshot.seed}.`
        : null,
    criteria: [
      { label: 'Benar: tidak ada data rusak', met: result.ok },
      {
        label: `Efisien: selesai dalam ${fast} tick atau kurang (tick: ${result.metrics.tick})`,
        met: efficient,
      },
      {
        label: `Hemat: total waktu tunggu ${lowWait} tick atau kurang (total: ${totalWait})`,
        met: frugal,
      },
    ],
    cards: [
      {
        label: 'Pembaruan hilang',
        value: String(result.metrics.lostUpdates ?? '-'),
      },
      { label: 'Total tick', value: String(result.metrics.tick) },
      { label: 'Waktu tunggu', value: String(totalWait) },
    ],
    explanation: level.explanation
      ? result.ok
        ? level.explanation.pass
        : level.explanation.fail
      : null,
  };
}
