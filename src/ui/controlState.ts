import type {
  ControllerState,
  RunState,
  Speed,
} from '../controller/SimulationController';

/** Pilihan kecepatan yang ditampilkan sebagai chip di HUD. */
export const SPEEDS: readonly Speed[] = [0.5, 1, 5];

/** Status yang tampil di chip: keadaan jalan, atau error engine. */
export type StatusKind = RunState | 'error';

const STATUS_LABEL: Record<StatusKind, string> = {
  idle: 'Siap',
  running: 'Berjalan',
  paused: 'Dijeda',
  finished: 'Selesai',
  error: 'Error',
};

export interface ControlView {
  /** True bila tombol utama berupa Pause (simulasi sedang berjalan). */
  showPause: boolean;
  /** Tombol Play/Pause boleh ditekan. */
  canTogglePlay: boolean;
  canStep: boolean;
  canReset: boolean;
  /** Seed boleh diubah (butuh level termuat). */
  canChangeSeed: boolean;
  status: StatusKind;
  /** Teks chip status, mis. "Dijeda · tick 7". */
  statusText: string;
}

/**
 * Menurunkan keadaan tombol HUD dari state controller. Aturannya sama dengan
 * controller (Run dan Step hanya saat idle/paused tanpa error); fungsi ini
 * hanya mencerminkannya untuk tampilan, bukan memutuskan aturan permainan.
 */
export function deriveControls(
  state: Pick<ControllerState, 'level' | 'runState' | 'error' | 'snapshot'>,
): ControlView {
  const { level, runState, error, snapshot } = state;
  const hasLevel = level !== null;
  const canStart =
    hasLevel &&
    error === null &&
    (runState === 'idle' || runState === 'paused');
  const status: StatusKind = error !== null ? 'error' : runState;
  const label = STATUS_LABEL[status];

  return {
    showPause: runState === 'running',
    canTogglePlay: runState === 'running' || canStart,
    canStep: canStart,
    canReset: hasLevel,
    canChangeSeed: hasLevel,
    status,
    statusText: snapshot !== null ? `${label} · tick ${snapshot.tick}` : label,
  };
}
