import { useEffect, useLayoutEffect, useRef } from 'react';
import type { SimulationController } from './controller/SimulationController';
import StartGame from './game/main';
import { REDUCE_MOTION_KEY } from './game/registryKeys';

interface PhaserGameProps {
  controller: SimulationController;
  /** Pengaturan "kurangi animasi"; diteruskan ke Phaser lewat registry. */
  reduceMotion?: boolean;
}

/**
 * Wadah arena Phaser. Game dibuat sekali saat dipasang dan dihancurkan saat
 * dilepas. Controller dan pengaturan animasi diteruskan ke Phaser lewat
 * registry game (lihat game/main.ts); komponen React tidak memanggil Phaser
 * langsung.
 */
export function PhaserGame({
  controller,
  reduceMotion = false,
}: PhaserGameProps) {
  const game = useRef<Phaser.Game | null>(null);
  // Nilai awal dibaca lewat ref agar perubahan reduceMotion tidak membuat ulang game.
  const initialReduceMotion = useRef(reduceMotion);

  useLayoutEffect(() => {
    if (game.current === null) {
      game.current = StartGame(
        'game-container',
        controller,
        initialReduceMotion.current,
      );
    }
    return () => {
      game.current?.destroy(true);
      game.current = null;
    };
  }, [controller]);

  // Perubahan pengaturan berlaku pada pembaruan robot berikutnya.
  useEffect(() => {
    game.current?.registry.set(REDUCE_MOTION_KEY, reduceMotion);
  }, [reduceMotion]);

  return <div id="game-container" className="h-full w-full" />;
}