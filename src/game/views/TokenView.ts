import { GameObjects, Scene } from 'phaser';
import type { SemaphoreSnapshot, ThreadId } from '../../engine/types';
import { TEXT_STYLE } from '../theme';

export interface TokenViewConfig {
  x: number;
  y: number;
  label?: string;
  maxCapacity?: number;
}

/** Cara mengubah id thread menjadi nama tampilan. */
export type NameOf = (id: ThreadId) => string;

/**
 * Tampilan Rak Kartu Akses / Token Semaphore (T-042).
 * Menampilkan kartu akses, jumlah token yang tersedia vs kapasitas awal,
 * serta antrean robot yang sedang menunggu kartu (bila ada).
 */
export class TokenView extends GameObjects.Container {
  readonly semId: string;
  private readonly panel: GameObjects.Rectangle;
  private readonly titleText: GameObjects.Text;
  private readonly countText: GameObjects.Text;
  private readonly queueBadge: GameObjects.Container;
  private readonly queueText: GameObjects.Text;
  private maxCapacity: number;

  constructor(
    scene: Scene,
    semId: string,
    config: TokenViewConfig,
  ) {
    super(scene, config.x, config.y);
    this.semId = semId;
    this.maxCapacity = config.maxCapacity ?? 3;

    const width = 160;
    const height = 70;

    // Panel background
    this.panel = scene.add
      .rectangle(0, 0, width, height, 0x132238, 0.9)
      .setStrokeStyle(2, 0x14b8a6)
      .setOrigin(0.5);
    this.add(this.panel);

    // Title label
    this.titleText = scene.add
      .text(0, -22, config.label ?? 'Kartu Akses (Sem)', {
        ...TEXT_STYLE,
        fontSize: '11px',
        color: '#2dd4bf',
      })
      .setOrigin(0.5);
    this.add(this.titleText);

    // Count text: e.g. "Kartu: 3 / 3"
    this.countText = scene.add
      .text(0, -2, `Kartu: ${this.maxCapacity} / ${this.maxCapacity}`, {
        ...TEXT_STYLE,
        fontSize: '14px',
        color: '#f9fafb',
      })
      .setOrigin(0.5);
    this.add(this.countText);

    // Queue badge container
    this.queueBadge = scene.add.container(0, 20);
    const badgeBg = scene.add
      .rectangle(0, 0, width - 20, 18, 0xef4444, 0.9)
      .setOrigin(0.5);
    this.queueText = scene.add
      .text(0, 0, 'Antre: 0', {
        ...TEXT_STYLE,
        fontSize: '10px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.queueBadge.add([badgeBg, this.queueText]);
    this.queueBadge.setVisible(false);
    this.add(this.queueBadge);

    scene.add.existing(this);
  }

  /**
   * Memperbarui visual sesuai data SemaphoreSnapshot terbaru.
   */
  updateSnapshot(snapshot: SemaphoreSnapshot, nameOf?: NameOf): void {
    if (snapshot.value > this.maxCapacity) {
      this.maxCapacity = snapshot.value;
    }

    const available = Math.max(0, snapshot.value);
    this.countText.setText(`Kartu: ${available} / ${this.maxCapacity}`);

    // Update warna border panel berdasarkan ketersediaan
    if (available === 0) {
      this.panel.setStrokeStyle(2, 0xef4444); // merah saat habis
    } else {
      this.panel.setStrokeStyle(2, 0x14b8a6); // teal saat tersedia
    }

    // Tampilkan antrean bila ada
    if (snapshot.queue.length > 0) {
      this.queueBadge.setVisible(true);
      const queueNames = nameOf
        ? snapshot.queue.map(nameOf).join(', ')
        : `${snapshot.queue.length} robot`;
      this.queueText.setText(`Antre: ${queueNames}`);
    } else {
      this.queueBadge.setVisible(false);
    }
  }

  setMaxCapacity(capacity: number): void {
    this.maxCapacity = capacity;
  }
}
