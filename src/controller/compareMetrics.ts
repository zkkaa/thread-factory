import type { Snapshot } from '../engine/types';
import type { ControllerState } from './SimulationController';

export type CompareSide = 'A' | 'B';
/** 'tidak-dinilai': metrik efisiensi tidak adil dibandingkan bila ada sisi yang hasilnya salah. */
export type Better = CompareSide | 'sama' | 'tidak-dinilai';

/** Satu baris tabel perbandingan. */
export interface CompareRow {
  key: string;
  label: string;
  a: number;
  b: number;
  /** true bila nilai lebih kecil lebih baik (tick, waktu tunggu, pelanggaran). */
  lowerIsBetter: boolean;
  better: Better;
}

export interface CompareSummary {
  rows: CompareRow[];
  /** true bila kedua sisi sudah selesai; sebelum itu angkanya masih sementara. */
  complete: boolean;
  /** Lulus atau gagal tiap sisi; null bila belum selesai. */
  okA: boolean | null;
  okB: boolean | null;
  /** Jumlah baris yang dimenangkan tiap sisi. */
  wins: { A: number; B: number };
}

const round2 = (value: number): number => Math.round(value * 100) / 100;

function totalWait(snap: Readonly<Snapshot>): number {
  return snap.threads.reduce((sum, thread) => sum + thread.waitTicks, 0);
}

/** Pelanggaran dari semua jenis (bentrok aula, overflow, underflow, bacaan setengah jadi, tabrakan tulis). */
function violations(snap: Readonly<Snapshot>): number {
  return (
    snap.overloadTicks +
    snap.overflowCount +
    snap.underflowCount +
    snap.inconsistentReadCount +
    snap.writeConflictCount
  );
}

function longestWait(snap: Readonly<Snapshot>): number {
  const streaks = Object.values(snap.peakWaitStreaks ?? {});
  return streaks.length === 0 ? 0 : Math.max(...streaks);
}

/**
 * Indeks keadilan Jain: (jumlah x)^2 / (n x jumlah kuadrat x). Bernilai 1 bila
 * semua sama rata, mendekati 1/n bila satu pihak memborong. Mengembalikan 0
 * bila belum ada yang mendapat giliran sama sekali. Fungsi murni.
 */
export function jainIndex(values: readonly number[]): number {
  const sum = values.reduce((total, value) => total + value, 0);
  const sumSquares = values.reduce((total, value) => total + value * value, 0);
  if (values.length === 0 || sumSquares === 0) return 0;
  return round2((sum * sum) / (values.length * sumSquares));
}

interface MetricDef {
  key: string;
  label: string;
  lowerIsBetter: boolean;
  /**
   * true untuk metrik kecepatan atau efisiensi. Metrik ini tidak dinilai bila
   * hasil salah satu sisi salah: sisi yang salah tidak boleh menang karena cepat.
   * Metrik kebenaran (pelanggaran, pembaruan hilang) tetap selalu dinilai.
   */
  efficiency: boolean;
  read: (snap: Readonly<Snapshot>, state: ControllerState) => number;
}

const DEFS: readonly MetricDef[] = [
  {
    key: 'ticks',
    label: 'Total tick',
    lowerIsBetter: true,
    efficiency: true,
    read: (snap) => snap.tick,
  },
  {
    key: 'throughput',
    label: 'Throughput (instruksi per tick)',
    lowerIsBetter: false,
    efficiency: true,
    read: (snap) =>
      snap.tick > 0 ? round2(snap.executedInstructions / snap.tick) : 0,
  },
  {
    key: 'wait',
    label: 'Total waktu tunggu',
    lowerIsBetter: true,
    efficiency: true,
    read: totalWait,
  },
  {
    key: 'longestWait',
    label: 'Tunggu terpanjang berturut-turut',
    lowerIsBetter: true,
    efficiency: true,
    read: longestWait,
  },
  {
    key: 'violations',
    label: 'Pelanggaran',
    lowerIsBetter: true,
    efficiency: false,
    read: violations,
  },
  {
    key: 'busyWait',
    label: 'Busy waiting',
    lowerIsBetter: true,
    efficiency: true,
    read: (snap) => snap.busyWaitTicks,
  },
  {
    // Hanya terisi setelah level selesai (butuh nilai target dari level).
    key: 'lostUpdates',
    label: 'Pembaruan hilang',
    lowerIsBetter: true,
    efficiency: false,
    read: (_snap, state) => state.result?.metrics.lostUpdates ?? 0,
  },
  {
    key: 'fairness',
    label: 'Pemerataan giliran (indeks Jain, 0 sampai 1)',
    lowerIsBetter: false,
    efficiency: true,
    read: (snap) => jainIndex(snap.threads.map((thread) => thread.iteration)),
  },
];

/**
 * Menilai satu metrik. Angka sama selalu `sama`. Metrik efisiensi yang tidak
 * adil dibandingkan (`rated = false`) menjadi `tidak-dinilai`. Fungsi murni.
 */
export function judgeMetric(
  a: number,
  b: number,
  lowerIsBetter: boolean,
  rated = true,
): Better {
  if (a === b) return 'sama';
  if (!rated) return 'tidak-dinilai';
  const aWins = lowerIsBetter ? a < b : a > b;
  return aWins ? 'A' : 'B';
}

/**
 * Membandingkan dua keadaan controller. Fungsi murni. Mengembalikan null bila
 * salah satu sisi belum punya snapshot (level belum dimuat).
 */
export function compareStates(
  a: ControllerState,
  b: ControllerState,
): CompareSummary | null {
  if (a.snapshot === null || b.snapshot === null) return null;
  const snapA = a.snapshot;
  const snapB = b.snapshot;
  const okA = a.result?.ok ?? null;
  const okB = b.result?.ok ?? null;
  // Efisiensi hanya adil dibandingkan bila kedua sisi sama-sama lulus. Sebelum
  // selesai (ok = null) angkanya masih sementara, jadi tetap dinilai biasa.
  const efficiencyRated = okA === null || okB === null || (okA && okB);

  const rows = DEFS.map((def): CompareRow => {
    const valueA = def.read(snapA, a);
    const valueB = def.read(snapB, b);
    return {
      key: def.key,
      label: def.label,
      a: valueA,
      b: valueB,
      lowerIsBetter: def.lowerIsBetter,
      better: judgeMetric(
        valueA,
        valueB,
        def.lowerIsBetter,
        def.efficiency ? efficiencyRated : true,
      ),
    };
  });

  return {
    rows,
    complete: a.runState === 'finished' && b.runState === 'finished',
    okA,
    okB,
    wins: {
      A: rows.filter((row) => row.better === 'A').length,
      B: rows.filter((row) => row.better === 'B').length,
    },
  };
}

// ---------------------------------------------------------------------------
// Vonis: kesimpulan satu kalimat, dihitung di sini agar UI hanya menampilkan.
// ---------------------------------------------------------------------------

/** Angka satu sisi yang dipakai vonis. */
export interface SideFigures {
  ticks: number;
  wait: number;
  lostUpdates: number;
  /** true bila semua robot TERMINATED (bukan macet atau terpotong batas tick). */
  allTerminated: boolean;
}

export type VerdictKind =
  | 'pending' // belum kedua-duanya selesai
  | 'winner' // satu sisi menang (lihat reason)
  | 'tradeoff' // keduanya benar, tetapi satu lebih cepat dan satu lebih sedikit menunggu
  | 'tie' // keduanya benar dan sama
  | 'bothFail'; // keduanya salah

export interface Verdict {
  kind: VerdictKind;
  /** Hanya terisi bila kind = 'winner'. */
  winner: CompareSide | null;
  loser: CompareSide | null;
  /** 'benar': satu lulus, satu gagal. 'efisien': keduanya lulus. */
  reason: 'benar' | 'efisien' | null;
  /**
   * Harga pemenang dibanding yang kalah (winner - loser). Positif berarti
   * pemenang lebih lambat atau lebih banyak menunggu. null bila tidak
   * bermakna (yang kalah tidak selesai, atau bukan kind 'winner').
   */
  tickDelta: number | null;
  waitDelta: number | null;
  /** Pembaruan hilang pada sisi yang kalah (hanya bila reason = 'benar'). */
  loserLostUpdates: number;
  /** false bila sisi yang kalah macet atau terpotong batas tick. */
  loserFinished: boolean;
  /** Khusus 'tradeoff': sisi yang lebih sedikit tick, dan selisih mutlaknya. */
  faster: CompareSide | null;
  tickGap: number;
  waitGap: number;
}

export interface VerdictInput {
  complete: boolean;
  okA: boolean | null;
  okB: boolean | null;
  a: SideFigures;
  b: SideFigures;
}

const EMPTY_VERDICT: Verdict = {
  kind: 'pending',
  winner: null,
  loser: null,
  reason: null,
  tickDelta: null,
  waitDelta: null,
  loserLostUpdates: 0,
  loserFinished: true,
  faster: null,
  tickGap: 0,
  waitGap: 0,
};

/**
 * Aturan vonis (fungsi murni): benar dulu, baru efisiensi.
 * 1. Belum selesai: pending.
 * 2. Satu lulus, satu gagal: yang lulus menang; harga = selisih tick dan waktu
 *    tunggu, hanya bermakna bila yang gagal sempat selesai.
 * 3. Keduanya lulus: lebih sedikit tick dan lebih sedikit waktu tunggu menang.
 *    Bila arahnya berlawanan: tradeoff (tanpa pemenang paksa). Bila sama: tie.
 * 4. Keduanya gagal: bothFail.
 */
export function verdictFrom(input: VerdictInput): Verdict {
  const { complete, okA, okB, a, b } = input;
  if (!complete || okA === null || okB === null) return EMPTY_VERDICT;

  if (!okA && !okB) return { ...EMPTY_VERDICT, kind: 'bothFail' };

  if (okA !== okB) {
    const winner: CompareSide = okA ? 'A' : 'B';
    const loser: CompareSide = okA ? 'B' : 'A';
    const fw = winner === 'A' ? a : b;
    const fl = loser === 'A' ? a : b;
    return {
      ...EMPTY_VERDICT,
      kind: 'winner',
      winner,
      loser,
      reason: 'benar',
      tickDelta: fl.allTerminated ? fw.ticks - fl.ticks : null,
      waitDelta: fl.allTerminated ? fw.wait - fl.wait : null,
      loserLostUpdates: fl.lostUpdates,
      loserFinished: fl.allTerminated,
    };
  }

  const dTick = Math.sign(a.ticks - b.ticks);
  const dWait = Math.sign(a.wait - b.wait);
  if (dTick === 0 && dWait === 0) return { ...EMPTY_VERDICT, kind: 'tie' };

  if (dTick * dWait === -1) {
    return {
      ...EMPTY_VERDICT,
      kind: 'tradeoff',
      faster: dTick < 0 ? 'A' : 'B',
      tickGap: Math.abs(a.ticks - b.ticks),
      waitGap: Math.abs(a.wait - b.wait),
    };
  }

  const winner: CompareSide = dTick < 0 || dWait < 0 ? 'A' : 'B';
  const loser: CompareSide = winner === 'A' ? 'B' : 'A';
  const fw = winner === 'A' ? a : b;
  const fl = winner === 'A' ? b : a;
  return {
    ...EMPTY_VERDICT,
    kind: 'winner',
    winner,
    loser,
    reason: 'efisien',
    tickDelta: fw.ticks - fl.ticks,
    waitDelta: fw.wait - fl.wait,
  };
}

/** Mengambil angka vonis dari satu sisi. Null bila level belum dimuat. */
export function sideFigures(state: ControllerState): SideFigures | null {
  const snap = state.snapshot;
  if (snap === null) return null;
  return {
    ticks: snap.tick,
    wait: totalWait(snap),
    lostUpdates: state.result?.metrics.lostUpdates ?? 0,
    allTerminated: snap.threads.every(
      (thread) => thread.state === 'TERMINATED',
    ),
  };
}

/** Vonis dua controller. Null bila salah satu sisi belum punya snapshot. */
export function computeVerdict(
  a: ControllerState,
  b: ControllerState,
): Verdict | null {
  const figuresA = sideFigures(a);
  const figuresB = sideFigures(b);
  if (figuresA === null || figuresB === null) return null;
  return verdictFrom({
    complete: a.runState === 'finished' && b.runState === 'finished',
    okA: a.result?.ok ?? null,
    okB: b.result?.ok ?? null,
    a: figuresA,
    b: figuresB,
  });
}
