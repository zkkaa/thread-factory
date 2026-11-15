import type { Better, CompareSummary } from '../controller/compareMetrics';
import { isSandboxSupported, type SandboxValues } from '../levels/sandbox';
import type { LevelDefinition } from '../levels/types';
import { planSandbox, type SandboxPlan } from './sandboxPanel';

/**
 * Menyiapkan level satu sisi. Level yang punya parameter Sandbox memakai
 * planSandbox; level lain dimuat apa adanya (hanya alat yang membedakan sisi).
 * Bintang selalu mati.
 */
export function planSide(
  level: LevelDefinition,
  values: SandboxValues,
): SandboxPlan {
  if (!isSandboxSupported(level.id)) {
    return { ok: true, level, options: { rated: false } };
  }
  return planSandbox(level, values);
}

export function describeBetter(better: Better): string {
  if (better === 'sama') return 'Sama';
  return `${better} lebih baik`;
}

export function verdictText(ok: boolean | null): string {
  if (ok === null) return 'Belum selesai';
  return ok ? 'Lulus' : 'Gagal';
}

export function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

/** Kalimat kesimpulan di atas tabel. Sisi yang gagal tidak dianggap menang. */
export function summaryHeadline(summary: CompareSummary): string {
  if (!summary.complete) {
    return 'Jalankan sampai kedua sisi selesai untuk hasil akhir. Angka di bawah masih sementara.';
  }
  if (summary.okA === true && summary.okB === false) {
    return 'A lulus, B gagal.';
  }
  if (summary.okA === false && summary.okB === true) {
    return 'B lulus, A gagal.';
  }
  const { A, B } = summary.wins;
  if (A === B) return 'Kedua sisi seimbang pada metrik di bawah.';
  return A > B
    ? `A unggul di ${A} metrik, B unggul di ${B}.`
    : `B unggul di ${B} metrik, A unggul di ${A}.`;
}

export interface CompareControlFlags {
  showPause: boolean;
  canTogglePlay: boolean;
  canStep: boolean;
  canReset: boolean;
  canChangeSeed: boolean;
}

/**
 * Menggabungkan status kontrol dua sisi. Aksi boleh bila salah satu sisi
 * bisa melakukannya (sisi yang tak bisa mengabaikan perintah); seed hanya
 * boleh diganti bila keduanya boleh.
 */
export function combineFlags(
  a: CompareControlFlags,
  b: CompareControlFlags,
): CompareControlFlags {
  return {
    showPause: a.showPause || b.showPause,
    canTogglePlay: a.canTogglePlay || b.canTogglePlay,
    canStep: a.canStep || b.canStep,
    canReset: a.canReset || b.canReset,
    canChangeSeed: a.canChangeSeed && b.canChangeSeed,
  };
}