import type { LevelResult, Stars } from '../controller/evaluateLevel';
import { batteryLevel } from '../engine/metrics';
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

/**
 * Level berbaterai = ada thread yang memakai busy waiting (SPIN_UNTIL) pada
 * program aslinya (mis. Level 1-4). Dibaca dari data, bukan dari id level.
 */
function usesBusyWaiting(level: LevelDefinition): boolean {
  return level.threads.some((thread) =>
    thread.program.some((instruction) => instruction.op === 'SPIN_UNTIL'),
  );
}

/** Kalimat gelembung Pak Mandor untuk level berbaterai. */
function batteryQuote(
  ok: boolean,
  completed: boolean,
  busyWait: number,
  percent: number,
): string {
  if (!completed) return 'Simulasi berhenti sebelum semua robot selesai.';
  if (ok) return `Baterai masih ${percent}%, hemat sekali.`;
  if (busyWait > 0) {
    return `Mengecek ${busyWait} kali sia-sia, baterai tinggal ${percent}%.`;
  }
  return 'Barang di meja belum sesuai target.';
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
  const battery = area === null && usesBusyWaiting(level);
  const overload = snapshot.overloadTicks;
  const busyWait = result.metrics.busyWaitTicks;
  const percent = Math.round(batteryLevel(busyWait) * 100);
  const completed = snapshot.threads.every((t) => t.state === 'TERMINATED');
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
  const coreCard = {
    label: 'Utilisasi core',
    value: `${Math.round(result.metrics.coreUtilization * 100)}%`,
  };

  let cards: { label: string; value: string }[];
  if (area !== null) {
    cards = [
      { label: 'Tick bentrok', value: String(overload) },
      tickCard,
      waitCard,
      {
        label: 'Utilisasi area',
        value: `${Math.round(snapshot.areaUtilization * 100)}%`,
      },
    ];
  } else if (battery) {
    cards = [
      { label: 'Tick boros (busy waiting)', value: String(busyWait) },
      { label: 'Baterai tersisa', value: `${percent}%` },
      tickCard,
      waitCard,
    ];
  } else {
    cards = [
      {
        label: 'Pembaruan hilang',
        value: String(result.metrics.lostUpdates ?? '-'),
      },
      tickCard,
      waitCard,
      ...(snapshot.cores > 1 ? [coreCard] : []),
    ];
  }

  let keyFigure: ResultView['keyFigure'];
  if (area !== null) {
    keyFigure = {
      label: 'Bentrok',
      actual: result.ok || overload > 0 ? String(overload) : 'belum selesai',
      target: '0',
      match: result.ok,
    };
  } else if (battery) {
    keyFigure = {
      label: 'Baterai',
      actual: `${percent}%`,
      target: 'hemat',
      match: result.ok,
    };
  } else {
    keyFigure = {
      label: capitalize(variable),
      actual: actualText,
      target: String(target),
      match: actual === target,
    };
  }

  let quote: string;
  if (area !== null) {
    quote = areaQuote(result.ok, area.name, overload);
  } else if (battery) {
    quote = batteryQuote(result.ok, completed, busyWait, percent);
  } else if (result.ok) {
    quote = `Hasilnya ${actualText}, sesuai target ${target}.`;
  } else {
    quote = `Seharusnya ${target}, hasilnya ${actualText}.`;
  }

  let correctLabel = 'Benar: tidak ada data rusak';
  if (area !== null) {
    correctLabel = `Benar: tidak ada bentrok di ${area.name}`;
  } else if (battery) {
    correctLabel = 'Benar: barang lengkap dan baterai hemat';
  }

  return {
    ok: result.ok,
    title: result.ok ? titles.pass : titles.fail,
    quote,
    message: result.message,
    stars: result.stars,
    seedNote:
      result.stars === null
        ? `Bintang hanya dinilai pada seed tutorial (${level.tutorialSeed ?? '-'}). Seed sekarang: ${snapshot.seed}.`
        : null,
    criteria: [
      { label: correctLabel, met: result.ok },
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
