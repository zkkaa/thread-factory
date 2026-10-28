import { CANVAS, Game, Scale } from 'phaser';
import type { SimulationController } from '../controller/SimulationController';
import { Boot } from './scenes/Boot';
import { LevelScene } from './scenes/LevelScene';
import { ARENA, COLORS } from './theme';
import { CONTROLLER_KEY, REDUCE_MOTION_KEY } from './registryKeys';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
  // type: AUTO,
  type: CANVAS,
  width: ARENA.width,
  height: ARENA.height,
  parent: 'game-container',
  backgroundColor: COLORS.background,
  // Kanvas 1024x768 diskalakan (FIT) mengikuti wadah yang memenuhi layar;
  // HUD React ditumpuk di atasnya (lihat ui/components/hud/PlayLayout.tsx).
  scale: {
    mode: Scale.FIT,
    autoCenter: Scale.CENTER_BOTH,
  },
  // Hanya dua scene yang dipakai. Scene bawaan template (Preloader, MainMenu,
  // Game, GameOver) tidak lagi didaftarkan.
  scene: [Boot, LevelScene],
};

/**
 * Memulai game di elemen `parent`. Controller dititipkan ke registry SEBELUM
 * game boot (preBoot) supaya sudah tersedia saat scene Boot berjalan.
 */
const StartGame = (
  parent: string,
  controller: SimulationController,
  reduceMotion: boolean,
) => {
  return new Game({
    ...config,
    parent,
    callbacks: {
      preBoot: (game) => {
        game.registry.set(CONTROLLER_KEY, controller);
        game.registry.set(REDUCE_MOTION_KEY, reduceMotion);
      },
    },
  });
};

export default StartGame;
