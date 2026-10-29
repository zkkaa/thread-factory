import { useEffect } from 'react';
import type { SimulationController } from '../../controller/SimulationController';
import type { AudioPlayer } from '../audio/audioPlayer';
import { soundForResult, soundsForEvents } from '../audio/soundMixer';

/**
 * Efek suara dari simulasi: kunci dipegang atau dilepas, dan hasil level.
 * Event dibandingkan lewat referensi supaya perubahan non-tick (kecepatan,
 * seed) tidak membunyikan ulang event lama.
 */
export function useSoundEffects(
  controller: SimulationController,
  player: AudioPlayer,
): void {
  useEffect(() => {
    let lastEvents = controller.getState().events;
    let lastResult = controller.getState().result;
    return controller.subscribe((state) => {
      if (state.events !== lastEvents) {
        lastEvents = state.events;
        for (const name of soundsForEvents(state.events)) {
          player.playSfx(name);
        }
      }
      if (state.result !== lastResult) {
        lastResult = state.result;
        if (state.result !== null) {
          player.playSfx(soundForResult(state.result.ok));
        }
      }
    });
  }, [controller, player]);
}

/**
 * Audio tingkat aplikasi: menyelaraskan volume dengan pengaturan, memulai
 * musik pada sentuhan pertama (peramban memblokir autoplay sebelum ada
 * interaksi), dan membunyikan klik untuk setiap tombol yang aktif.
 */
export function useAppAudio(player: AudioPlayer, volume: number): void {
  useEffect(() => {
    player.setVolume(volume);
  }, [player, volume]);

  useEffect(() => {
    const startMusic = (): void => player.startMusic();
    const onClick = (event: MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest('button');
      if (button !== null && !button.disabled) player.playSfx('click');
    };
    window.addEventListener('pointerdown', startMusic, { once: true });
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('pointerdown', startMusic);
      document.removeEventListener('click', onClick);
    };
  }, [player]);
}
