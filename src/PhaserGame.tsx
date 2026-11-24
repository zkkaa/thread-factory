import { useEffect, useLayoutEffect, useRef } from 'react';
import type { SimulationController } from './controller/SimulationController';
import StartGame from './game/main';
import { REDUCE_MOTION_KEY } from './game/registryKeys';

interface PhaserGameProps {
  controller: SimulationController;
  /** Pengaturan "kurangi animasi"; diteruskan ke Phaser lewat registry. */
  reduceMotion?: boolean;
  /**
   * Id elemen wadah. Harus unik bila ada lebih dari satu arena di layar
   * (mode Bandingkan). Default cocok untuk satu arena.
   */
  parentId?: string;
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
  parentId = 'game-container',
}: PhaserGameProps) {
  const game = useRef<Phaser.Game | null>(null);
  // Nilai awal dibaca lewat ref agar perubahan reduceMotion tidak membuat ulang game.
  const initialReduceMotion = useRef(reduceMotion);

  useLayoutEffect(() => {
    if (game.current === null) {
      game.current = StartGame(
        parentId,
        controller,
        initialReduceMotion.current,
      );
    }
    return () => {
      game.current?.destroy(true);
      game.current = null;
    };
  }, [controller, parentId]);

  // Perubahan pengaturan berlaku pada pembaruan robot berikutnya.
  useEffect(() => {
    game.current?.registry.set(REDUCE_MOTION_KEY, reduceMotion);
  }, [reduceMotion]);

  return <div id={parentId} className="h-full w-full" />;
}
