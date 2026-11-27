import type { LevelResult, Stars } from '../controller/evaluateLevel';
import { batteryLevel } from '../engine/metrics';
import type { Snapshot } from '../engine/types';
import type { LevelDefinition } from '../levels/types';
import { areaOf } from './areaMode';
import { totalTakenItems } from './beltInfo';

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
  keyFigure: {
    label: string;
    actual: string;
    target: string;
    match: boolean;
    display?: string;
  };
}

const DEFAULT_TITLES = {
  pass: 'Bagus! Berhasil!',
  fail: 'Waduh, Hasilnya Salah!',
};

const TIMING_FAIL_TITLE = 'Waduh, Lampu Terlalu Cepat!';

const TIMING_FAIL_EXPLANATION =
  'Condition variable hanya boleh membangunkan thread setelah kondisinya ' +
  'benar (barang minimal 3). Sinyal yang datang lebih awal membangunkan ' +
  'Pengepak terlalu dini. Pada program sungguhan, thread yang bangun juga ' +
  'mengecek ulang kondisinya (while), bukan langsung melanjutkan.';

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
 * Kalimat gelembung Pak Mandor untuk level berban (mis. Level 2-1). Penyebab
 * kegagalan disebut menurut kasusnya: barang jatuh, tangan kosong, atau macet.
 */
function beltQuote(
  ok: boolean,
  completed: boolean,
  taken: number,
  total: number,
  overflow: number,
  underflow: number,
): string {
  if (ok) return `${total} barang sampai, tidak ada yang jatuh.`;
  if (overflow > 0 && underflow > 0) {
    return `Barang jatuh ${overflow} kali dan pengepak meraih ban kosong ${underflow} kali.`;
  }
  if (overflow > 0) {
    return `Ada ${overflow} barang jatuh karena ban penuh.`;
  }
  if (underflow > 0) {
    return `Pengepak meraih ban kosong ${underflow} kali.`;
  }
  const progress = `Baru ${taken} dari ${total} barang sampai.`;
  return completed ? progress : `${progress} Robot saling menunggu.`;
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
  timingFail: boolean,
): string {
  if (!completed) return 'Simulasi berhenti sebelum semua robot selesai.';
  if (ok)
    return `Pengepak tidur sampai lampu menyala, baterai masih ${percent}%.`;
  if (timingFail) return 'Lampu menyala sebelum barang cukup.';
  if (busyWait > 0) {
    return `Mengecek ${busyWait} kali sia-sia, baterai tinggal ${percent}%.`;
  }
  return 'Barang di meja belum sesuai target.';
}

/** Kalimat gelembung khusus level menurut bintang; null bila tidak ada. */
function starQuote(level: LevelDefinition, result: LevelResult): string | null {
  const custom = level.resultQuote;
  if (custom === undefined || !result.ok) return null;
  if (result.stars === 3) return custom.stars3 ?? null;
  if (result.stars === 2) return custom.stars2 ?? null;
  if (result.stars === 1) return custom.stars1 ?? null;
  return null;
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
  // Level berban (Level 2-1): variabel target hanya placeholder, jadi yang
  // ditampilkan adalah isi ban dari snapshot.
  const beltTotal = area === null && !battery ? totalTakenItems(level) : null;
  const belt = beltTotal !== null;
  const beltTaken = snapshot.buffers.reduce((sum, b) => sum + b.totalTaken, 0);
  const overflow = snapshot.overflowCount;
  const underflow = snapshot.underflowCount;
  // Level berbaterai yang gagal padahal selesai dan tanpa busy waiting:
  // masalahnya waktu sinyal (Pengepak dibangunkan sebelum barang cukup).
  const timingFail = battery && completed && !result.ok && busyWait === 0;
  const totalWait = Object.values(result.metrics.waitTicksByThread).reduce(
    (a, b) => a + b,
    0,
  );
  // BARU: fastest opsional; bila ada, ★★★ dinilai dari tick (sama dengan evaluateLevel).
  const { fast, lowWait, fastest } = level.goal.stars;
  const efficient = result.ok && result.metrics.tick <= fast;
  const frugal =
    efficient &&
    (fastest !== undefined
      ? result.metrics.tick <= fastest
      : totalWait <= lowWait);
  const titles = level.resultTitle ?? DEFAULT_TITLES;
  const verdictMode = level.resultMode === 'verdict';

  const tickCard = { label: 'Total tick', value: String(result.metrics.tick) };
  const waitCard = { label: 'Waktu tunggu', value: String(totalWait) };
  const coreCard = {
    label: 'Utilisasi core',
    value: `${Math.round(result.metrics.coreUtilization * 100)}%`,
  };

  let cards: { label: string; value: string }[];
  if (verdictMode) {
    cards = [tickCard, waitCard];
  } else if (area !== null) {
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
  } else if (belt) {
    cards = [
      { label: 'Barang jatuh (overflow)', value: String(overflow) },
      { label: 'Tangan kosong (underflow)', value: String(underflow) },
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
  if (verdictMode) {
    keyFigure = {
      label: 'Hasil',
      actual: result.ok ? 'aman' : 'bermasalah',
      target: 'aman',
      match: result.ok,
    };
  } else if (area !== null) {
    keyFigure = {
      label: 'Bentrok',
      actual: result.ok || overload > 0 ? String(overload) : 'belum selesai',
      target: '0',
      match: result.ok,
      display: result.ok ? 'Tidak ada' : undefined,
    };
  } else if (timingFail) {
    keyFigure = {
      label: 'Lampu',
      actual: 'terlalu cepat',
      target: 'tepat',
      match: false,
      display: 'Terlalu cepat',
    };
  } else if (battery) {
    keyFigure = {
      label: 'Baterai',
      actual: `${percent}%`,
      target: 'hemat',
      match: result.ok,
      display: result.ok
        ? `${percent}% (hemat)`
        : percent === 0
          ? 'Habis'
          : `${percent}% (boros)`,
    };
  } else if (belt) {
    // match mengikuti hasil penilaian (bukan jumlah saja): 8 / 8 tetap merah
    // bila ada barang jatuh. Bentuk "x / y" dipakai agar tidak ada simbol "="
    // yang menyesatkan pada kasus itu.
    keyFigure = {
      label: 'Barang sampai',
      actual: String(beltTaken),
      target: String(beltTotal),
      match: result.ok,
      display: `${beltTaken} / ${beltTotal}`,
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
  if (verdictMode) {
    quote = result.message;
  } else if (area !== null) {
    quote =
      starQuote(level, result) ?? areaQuote(result.ok, area.name, overload);
  } else if (battery) {
    quote = batteryQuote(result.ok, completed, busyWait, percent, timingFail);
  } else if (belt) {
    quote =
      starQuote(level, result) ??
      beltQuote(
        result.ok,
        completed,
        beltTaken,
        beltTotal,
        overflow,
        underflow,
      );
  } else if (result.ok) {
    quote =
      starQuote(level, result) ??
      `Hasilnya ${actualText}, sesuai target ${target}.`;
  } else {
    quote = `Seharusnya ${target}, hasilnya ${actualText}.`;
  }

  let correctLabel = 'Benar: tidak ada data rusak';
  if (area !== null) {
    correctLabel = `Benar: tidak ada bentrok di ${area.name}`;
  } else if (battery) {
    correctLabel = 'Benar: barang lengkap dan baterai hemat';
  } else if (belt) {
    correctLabel = 'Benar: semua barang sampai, tidak ada yang jatuh atau meraih kosong';
  }

  if (verdictMode) correctLabel = 'Benar: semua robot selesai tanpa masalah';

  let title = titles.fail;
  if (result.ok) title = titles.pass;
  else if (timingFail) title = TIMING_FAIL_TITLE;

  // BARU: pesan dipilih dari bintang. ★★★ atau tidak dinilai (seed bukan
  // tutorial) memakai `pass`; ★ dan ★★ memakai `partial` bila level punya.
  let explanation: string | null = null;
  if (timingFail) {
    explanation = TIMING_FAIL_EXPLANATION;
  } else if (level.explanation) {
    const { pass, fail, partial } = level.explanation;
    if (!result.ok) explanation = fail;
    else if (result.stars === null || result.stars === 3) explanation = pass;
    else explanation = partial ?? pass;
  }

  // BARU: label kriteria ★★★ mengikuti jenis ambangnya.
  const thirdLabel =
    fastest !== undefined
      ? `Hemat: selesai dalam ${fastest} tick atau kurang (tick: ${result.metrics.tick})`
      : `Hemat: total waktu tunggu ${lowWait} tick atau kurang (total: ${totalWait})`;

  return {
    ok: result.ok,
    title,
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
      { label: thirdLabel, met: frugal },
    ],
    cards,
    explanation,
    coreUtilization:
      snapshot.cores > 1
        ? `${Math.round(result.metrics.coreUtilization * 100)}%`
        : null,
    keyFigure,
  };
}