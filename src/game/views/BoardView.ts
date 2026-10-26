import { GameObjects, Scene } from 'phaser';
import { TEXT_STYLE } from '../theme';

/**
 * Tampilan Papan Stok (shared variable): satu baris teks berisi semua
 * variabel bersama beserta nilainya, mis. "Papan Stok     stok: 8".
 * Nilainya selalu berasal dari snapshot; view tidak menghitung apa pun.
 */
export class BoardView {
  private readonly text: GameObjects.Text;

  constructor(
    scene: Scene,
    sharedVars: Readonly<Record<string, number>>,
    x: number,
    y: number,
  ) {
    this.text = scene.add
      .text(x, y, '', { ...TEXT_STYLE, fontSize: '24px' })
      .setOrigin(0.5);
    this.update(sharedVars);
  }

  update(sharedVars: Readonly<Record<string, number>>): void {
    const values = Object.entries(sharedVars)
      .map(([name, value]) => `${name}: ${value}`)
      .join('     ');
    this.text.setText(`Papan Stok     ${values}`);
  }

  destroy(): void {
    this.text.destroy();
  }
}
