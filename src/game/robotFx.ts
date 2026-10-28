import type { ThreadState } from '../engine/types';

export interface RobotFx {
  /** Cincin sorotan di belakang robot (RUNNING). */
  glow: boolean;
  /** Cincin berdenyut; mati bila kurangi animasi. */
  pulse: boolean;
  /** Penanda "dibekukan" zzz (READY). */
  frozen: boolean;
  /** zzz melayang; mati bila kurangi animasi. */
  float: boolean;
}

/**
 * Menentukan efek visual Si Penjadwal dari state thread. Efek tetap tampil
 * saat kurangi animasi, hanya geraknya yang dimatikan, jadi state tetap
 * terbaca tanpa bergantung pada animasi.
 */
export function deriveRobotFx(
  state: ThreadState,
  reduceMotion: boolean,
): RobotFx {
  const glow = state === 'RUNNING';
  const frozen = state === 'READY';
  return {
    glow,
    pulse: glow && !reduceMotion,
    frozen,
    float: frozen && !reduceMotion,
  };
}
