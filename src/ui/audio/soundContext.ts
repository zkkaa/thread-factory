import { createContext, useContext } from 'react';
import { SILENT_PLAYER, type AudioPlayer } from './audioPlayer';

/** Tanpa penyedia, komponen memakai pemutar senyap (aman untuk tes). */
export const SoundContext = createContext<AudioPlayer>(SILENT_PLAYER);

export function useSound(): AudioPlayer {
  return useContext(SoundContext);
}
