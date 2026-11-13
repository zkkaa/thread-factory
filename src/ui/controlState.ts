import type {
  ControllerState,
  RunState,
  Speed,
} from '../controller/SimulationController';

/** Pilihan kecepatan yang ditampilkan sebagai chip di HUD. */
export const SPEEDS: readonly Speed[] = [0.5, 1, 5];

/** Status yang tampil di chip: keadaan jalan, deadlock menunggu pemulihan, atau error engine. */
export type StatusKind = RunState | 'deadlock' | 'error';

const STATUS_LABEL: Record<StatusKind, string> = {
  idle: 'Siap',
  running: 'Berjalan',
  paused: 'Dijeda',
  finished: 'Selesai',
  deadlock: 'Deadlock',
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
  /** Tombol "Rampas kunci" boleh ditekan (engine macet karena deadlock). */
  canPreempt: boolean;
  status: StatusKind;
  /** Teks chip status, mis. "Dijeda · tick 7". */
  statusText: string;
}

/**
 * Menurunkan keadaan tombol HUD dari state controller. Aturannya sama dengan
 * controller (Run dan Step hanya saat idle/paused, tanpa error, dan tidak
 * sedang macet karena deadlock); fungsi ini hanya mencerminkannya untuk
 * tampilan, bukan memutuskan aturan permainan.
 */
export function deriveControls(
  state: Pick<ControllerState, 'level' | 'runState' | 'error' | 'snapshot'>,
): ControlView {
  const { level, runState, error, snapshot } = state;
  const hasLevel = level !== null;
  const stalled = (snapshot?.deadlock ?? null) !== null;
  const canStart =
    hasLevel &&
    error === null &&
    !stalled &&
    (runState === 'idle' || runState === 'paused');
  const status: StatusKind =
    error !== null ? 'error' : stalled ? 'deadlock' : runState;
  const label = STATUS_LABEL[status];

  return {
    showPause: runState === 'running',
    canTogglePlay: runState === 'running' || canStart,
    canStep: canStart,
    canReset: hasLevel,
    canChangeSeed: hasLevel,
    canPreempt: hasLevel && error === null && stalled,
    status,
    statusText: snapshot !== null ? `${label} · tick ${snapshot.tick}` : label,
  };
}
