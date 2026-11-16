import type { Snapshot } from '../engine/types';
import type { ControllerState } from './SimulationController';

export type CompareSide = 'A' | 'B';
export type Better = CompareSide | 'sama';

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
  read: (snap: Readonly<Snapshot>, state: ControllerState) => number;
}

const DEFS: readonly MetricDef[] = [
  {
    key: 'ticks',
    label: 'Total tick',
    lowerIsBetter: true,
    read: (snap) => snap.tick,
  },
  {
    key: 'throughput',
    label: 'Throughput (instruksi per tick)',
    lowerIsBetter: false,
    read: (snap) =>
      snap.tick > 0 ? round2(snap.executedInstructions / snap.tick) : 0,
  },
  {
    key: 'wait',
    label: 'Total waktu tunggu',
    lowerIsBetter: true,
    read: totalWait,
  },
  {
    key: 'longestWait',
    label: 'Tunggu terpanjang berturut-turut',
    lowerIsBetter: true,
    read: longestWait,
  },
  {
    key: 'violations',
    label: 'Pelanggaran',
    lowerIsBetter: true,
    read: violations,
  },
  {
    key: 'busyWait',
    label: 'Busy waiting',
    lowerIsBetter: true,
    read: (snap) => snap.busyWaitTicks,
  },
  {
    // Hanya terisi setelah level selesai (butuh nilai target dari level).
    key: 'lostUpdates',
    label: 'Pembaruan hilang',
    lowerIsBetter: true,
    read: (_snap, state) => state.result?.metrics.lostUpdates ?? 0,
  },
  {
    key: 'fairness',
    label: 'Pemerataan giliran (indeks Jain, 0 sampai 1)',
    lowerIsBetter: false,
    read: (snap) => jainIndex(snap.threads.map((thread) => thread.iteration)),
  },
];

function judge(a: number, b: number, lowerIsBetter: boolean): Better {
  if (a === b) return 'sama';
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

  const rows = DEFS.map((def): CompareRow => {
    const valueA = def.read(snapA, a);
    const valueB = def.read(snapB, b);
    return {
      key: def.key,
      label: def.label,
      a: valueA,
      b: valueB,
      lowerIsBetter: def.lowerIsBetter,
      better: judge(valueA, valueB, def.lowerIsBetter),
    };
  });

  return {
    rows,
    complete: a.runState === 'finished' && b.runState === 'finished',
    okA: a.result?.ok ?? null,
    okB: b.result?.ok ?? null,
    wins: {
      A: rows.filter((row) => row.better === 'A').length,
      B: rows.filter((row) => row.better === 'B').length,
    },
  };
}