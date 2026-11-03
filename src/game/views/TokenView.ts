import { GameObjects, Scene } from 'phaser';
import type { SemaphoreSnapshot, ThreadId } from '../../engine/types';
import { TEXT_STYLE, TOKEN_COLORS, TOKEN_PANEL } from '../theme';

export interface TokenViewConfig {
  x: number;
  y: number;
  label?: string;
  /** Nilai awal sementara; snapshot pertama menggantikannya (lihat updateSnapshot). */
  maxCapacity?: number;
}

/** Cara mengubah id thread menjadi nama tampilan. */
export type NameOf = (id: ThreadId) => string;

/**
 * Tampilan Rak Kartu Akses / Token Semaphore (T-042).
 * Menampilkan jumlah kartu yang tersedia dibanding kapasitas awal, serta
 * antrean robot yang menunggu kartu (bila ada). Hanya menggambar; tidak ada
 * aturan permainan di sini.
 */
export class TokenView extends GameObjects.Container {
  readonly semId: string;
  private readonly panel: GameObjects.Rectangle;
  private readonly titleText: GameObjects.Text;
  private readonly countText: GameObjects.Text;
  private readonly queueBadge: GameObjects.Container;
  private readonly queueText: GameObjects.Text;
  private maxCapacity: number;
  private capacityKnown = false;

  constructor(scene: Scene, semId: string, config: TokenViewConfig) {
    super(scene, config.x, config.y);
    this.semId = semId;
    this.maxCapacity = config.maxCapacity ?? 0;

    this.panel = scene.add
      .rectangle(
        0,
        0,
        TOKEN_PANEL.width,
        TOKEN_PANEL.height,
        TOKEN_COLORS.panel,
        TOKEN_PANEL.fillAlpha,
      )
      .setStrokeStyle(TOKEN_PANEL.strokeWidth, TOKEN_COLORS.available)
      .setOrigin(0.5);
    this.add(this.panel);

    this.titleText = scene.add
      .text(0, TOKEN_PANEL.titleY, config.label ?? 'Kartu Akses (Sem)', {
        ...TEXT_STYLE,
        fontSize: TOKEN_PANEL.titleFontSize,
        color: TOKEN_COLORS.title,
      })
      .setOrigin(0.5);
    this.add(this.titleText);

    this.countText = scene.add
      .text(0, TOKEN_PANEL.countY, this.countLabel(this.maxCapacity), {
        ...TEXT_STYLE,
        fontSize: TOKEN_PANEL.countFontSize,
        color: TOKEN_COLORS.count,
      })
      .setOrigin(0.5);
    this.add(this.countText);

    this.queueBadge = scene.add.container(0, TOKEN_PANEL.queueY);
    const badgeBg = scene.add
      .rectangle(
        0,
        0,
        TOKEN_PANEL.width - TOKEN_PANEL.queuePadding,
        TOKEN_PANEL.queueHeight,
        TOKEN_COLORS.queueBadge,
        TOKEN_PANEL.fillAlpha,
      )
      .setOrigin(0.5);
    this.queueText = scene.add
      .text(0, 0, 'Antre: 0', {
        ...TEXT_STYLE,
        fontSize: TOKEN_PANEL.queueFontSize,
        color: TOKEN_COLORS.queueText,
      })
      .setOrigin(0.5);
    this.queueBadge.add([badgeBg, this.queueText]);
    this.queueBadge.setVisible(false);
    this.add(this.queueBadge);

    scene.add.existing(this);
  }

  private countLabel(available: number): string {
    return `Kartu: ${available} / ${this.maxCapacity}`;
  }

  /**
   * Memperbarui visual sesuai SemaphoreSnapshot terbaru.
   *
   * Scene membangun ulang view ini setiap kembali ke tick 0 (Reset atau alat
   * berubah), jadi snapshot pertama yang diterima adalah nilai awal EFEKTIF,
   * yaitu nilai pilihan pemain, bukan nilai awal di data level. Karena itu
   * kapasitas diambil dari snapshot pertama, supaya kapasitas 1 tampil "1 / 1"
   * dan bukan "1 / 3".
   */
  updateSnapshot(snapshot: SemaphoreSnapshot, nameOf?: NameOf): void {
    if (!this.capacityKnown) {
      this.maxCapacity = Math.max(0, snapshot.value);
      this.capacityKnown = true;
    } else if (snapshot.value > this.maxCapacity) {
      this.maxCapacity = snapshot.value;
    }

    // Nilai semaphore bisa negatif (jumlah robot yang antre); kartu tersedia minimal 0.
    const available = Math.max(0, snapshot.value);
    this.countText.setText(this.countLabel(available));
    this.panel.setStrokeStyle(
      TOKEN_PANEL.strokeWidth,
      available === 0 ? TOKEN_COLORS.empty : TOKEN_COLORS.available,
    );

    if (snapshot.queue.length > 0) {
      this.queueBadge.setVisible(true);
      const names = nameOf
        ? snapshot.queue.map(nameOf).join(', ')
        : `${snapshot.queue.length} robot`;
      this.queueText.setText(`Antre: ${names}`);
    } else {
      this.queueBadge.setVisible(false);
    }
  }

  setMaxCapacity(capacity: number): void {
    this.maxCapacity = capacity;
    this.capacityKnown = true;
  }
}
