import type { SimEvent } from '../../engine/types';
import { MUSIC_GAIN, type SoundName } from './soundBank';

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const sfxVolume = (master: number): number => clamp01(master);
export const musicVolume = (master: number): number =>
  clamp01(master) * MUSIC_GAIN;

/**
 * Efek suara untuk sekelompok event dari satu notifikasi controller. Pada
 * kecepatan tinggi satu notifikasi memuat banyak tick, jadi tiap bunyi
 * dimainkan paling banyak satu kali.
 */
export function soundsForEvents(events: readonly SimEvent[]): SoundName[] {
  const names: SoundName[] = [];
  for (const event of events) {
    if (event.type === 'LOCK_ACQUIRED' && !names.includes('lock')) {
      names.push('lock');
    }
    if (event.type === 'LOCK_RELEASED' && !names.includes('unlock')) {
      names.push('unlock');
    }
  }
  return names;
}

export function soundForResult(ok: boolean): SoundName {
  return ok ? 'success' : 'fail';
}
