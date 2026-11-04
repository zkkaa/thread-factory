import type { LevelResult, Stars } from '../controller/evaluateLevel';
import type { Snapshot } from '../engine/types';
import type { LevelDefinition } from '../levels/types';
import { areaOf } from './areaMode';

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
  /** Utilisasi core untuk level multicore (null bila single core). */
  coreUtilization: string | null;
  /** Angka kunci untuk bar besar, mis. "Stok: 8 ≠ 10". Hanya untuk tampilan. */
  keyFigure: { label: string; actual: string; target: string; match: boolean };
}

const DEFAULT_TITLES = {
  pass: 'Bagus! Berhasil!',
  fail: 'Waduh, Hasilnya Salah!',
};

function capitalize(text: string): string {
  return text.length === 0
    ? text
    : text.charAt(0).toUpperCase() + text.slice(1);
}

/** Kalimat gelembung Pak Mandor untuk level berarea (mis. aula Level 1-3). */
function areaQuote(ok: boolean, areaName: string, overload: number): string {
  if (ok) return `Tanpa bentrok di ${areaName}, semua robot aman.`;
  if (overload > 0) {
    return `Seharusnya tanpa bentrok, hasilnya ${overload} tick bentrok.`;
  }
  return 'Simulasi berhenti sebelum semua robot selesai.';
}

/** Mengubah hasil penilaian controller menjadi data tampilan. Tidak menilai ulang. */
export function deriveResultView(
  level: LevelDefinition,
  snapshot: Snapshot,
  result: LevelResult,
): ResultView {
  const { variable, value: target } = level.goal.target;
  const actual = snapshot.sharedVars[variable];
  const actualText = actual === undefined ? '-' : String(actual);
  const area = areaOf(level);
  const overload = snapshot.overloadTicks;
  const totalWait = Object.values(result.metrics.waitTicksByThread).reduce(
    (a, b) => a + b,
    0,
  );
  const { fast, lowWait } = level.goal.stars;
  const efficient = result.ok && result.metrics.tick <= fast;
  const frugal = efficient && totalWait <= lowWait;
  const titles = level.resultTitle ?? DEFAULT_TITLES;

  const tickCard = { label: 'Total tick', value: String(result.metrics.tick) };
  const waitCard = { label: 'Waktu tunggu', value: String(totalWait) };
  const cards =
    area === null
      ? [
          {
            label: 'Pembaruan hilang',
            value: String(result.metrics.lostUpdates ?? '-'),
          },
          tickCard,
          waitCard,
          ...(snapshot.cores > 1
            ? [
                {
                  label: 'Utilisasi core',
                  value: `${Math.round(result.metrics.coreUtilization * 100)}%`,
                },
              ]
            : []),
        ]
      : [
          { label: 'Tick bentrok', value: String(overload) },
          tickCard,
          waitCard,
          {
            label: 'Utilisasi area',
            value: `${Math.round(snapshot.areaUtilization * 100)}%`,
          },
        ];

  const keyFigure =
    area === null
      ? {
          label: capitalize(variable),
          actual: actualText,
          target: String(target),
          match: actual === target,
        }
      : {
          label: 'Bentrok',
          actual:
            result.ok || overload > 0 ? String(overload) : 'belum selesai',
          target: '0',
          match: result.ok,
        };

  return {
    ok: result.ok,
    title: result.ok ? titles.pass : titles.fail,
    quote:
      area !== null
        ? areaQuote(result.ok, area.name, overload)
        : result.ok
          ? `Hasilnya ${actualText}, sesuai target ${target}.`
          : `Seharusnya ${target}, hasilnya ${actualText}.`,
    message: result.message,
    stars: result.stars,
    seedNote:
      result.stars === null
        ? `Bintang hanya dinilai pada seed tutorial (${level.tutorialSeed ?? '-'}). Seed sekarang: ${snapshot.seed}.`
        : null,
    criteria: [
      {
        label:
          area === null
            ? 'Benar: tidak ada data rusak'
            : `Benar: tidak ada bentrok di ${area.name}`,
        met: result.ok,
      },
      {
        label: `Efisien: selesai dalam ${fast} tick atau kurang (tick: ${result.metrics.tick})`,
        met: efficient,
      },
      {
        label: `Hemat: total waktu tunggu ${lowWait} tick atau kurang (total: ${totalWait})`,
        met: frugal,
      },
    ],
    cards,
    explanation: level.explanation
      ? result.ok
        ? level.explanation.pass
        : level.explanation.fail
      : null,
    coreUtilization:
      snapshot.cores > 1
        ? `${Math.round(result.metrics.coreUtilization * 100)}%`
        : null,
    keyFigure,
  };
}
