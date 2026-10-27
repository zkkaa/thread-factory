import { useLayoutEffect, useRef } from 'react';
import type { SimulationController } from './controller/SimulationController';
import StartGame from './game/main';

interface PhaserGameProps {
  controller: SimulationController;
}

/**
 * Wadah arena Phaser. Game dibuat sekali saat dipasang dan dihancurkan saat
 * dilepas. Controller diteruskan ke Phaser lewat registry game (lihat
 * game/main.ts); komponen React tidak memanggil Phaser langsung.
 */
export function PhaserGame({ controller }: PhaserGameProps) {
  const game = useRef<Phaser.Game | null>(null);

  useLayoutEffect(() => {
    if (game.current === null) {
      game.current = StartGame('game-container', controller);
    }
    return () => {
      game.current?.destroy(true);
      game.current = null;
    };
  }, [controller]);

  return <div id="game-container" className="h-full w-full" />;
}
