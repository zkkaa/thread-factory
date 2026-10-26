import { Scene } from 'phaser';
import type { SimulationController } from '../../controller/SimulationController';
import { CONTROLLER_KEY } from '../registryKeys';

/**
 * Scene pertama: mengambil controller dari registry lalu langsung memulai
 * LevelScene. Tidak ada aset yang perlu dimuat karena arena memakai bentuk
 * geometris (PRD bagian 15).
 */
export class Boot extends Scene {
  constructor() {
    super('Boot');
  }

  create() {
    const controller = this.registry.get(CONTROLLER_KEY) as
      SimulationController | undefined;
    if (controller === undefined) {
      throw new Error(
        'Controller belum dititipkan ke registry (lihat game/main.ts).',
      );
    }
    this.scene.start('LevelScene', { controller });
  }
}
