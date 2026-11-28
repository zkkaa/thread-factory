import { GameObjects, Scene } from 'phaser';
import type { BufferSnapshot, SimEvent } from '../../engine/types';
import { TINY_FACTORY, TINY_FRAMES } from '../assetManifest';
import {
  bufferFlash,
  describeBuffer,
  layoutSlots,
  type SlotSpot,
} from '../bufferState';
import type { Rect } from '../layouts/types';
import { REDUCE_MOTION_KEY } from '../registryKeys';
import { BELT, COLORS, DEPTH, TEXT_STYLE } from '../theme';

interface SlotView {
  box: GameObjects.Rectangle;
  crate: GameObjects.Image | null;
}

/**
 * Ban berjalan berslot terbatas. Barang menumpuk dari sisi consumer (kanan).
 * Panah di bawah slot menunjukkan arah aliran (kiri ke kanan). Saat barang
 * ditaruh, peti meluncur dari ujung producer ke slotnya; saat diambil, peti
 * meluncur keluar di ujung consumer. Overflow tampil sebagai peti jatuh di
 * ujung producer (kiri), underflow sebagai teks "TANGAN KOSONG" di ujung
 * consumer (kanan). Hitungan overflow dan underflow selalu tampil sebagai
 * teks; semua gerak dimatikan oleh "kurangi animasi". View ini hanya
 * menggambar apa yang dilaporkan engine.
 */
export class BufferView {
  private readonly objects: GameObjects.GameObject[] = [];
  private readonly slots: SlotView[] = [];
  private readonly effects = new Set<GameObjects.GameObject>();
  private readonly panel: GameObjects.Rectangle;
  private readonly header: GameObjects.Text;
  private readonly stats: GameObjects.Text;
  private readonly spots: SlotSpot[];
  private readonly bufferId: string;
  private lastEvents: readonly SimEvent[] | null = null;

  constructor(
    private readonly scene: Scene,
    private readonly rect: Rect,
    buffer: BufferSnapshot,
  ) {
    this.bufferId = buffer.id;
    this.panel = this.track(
      scene.add
        .rectangle(
          rect.x + rect.width / 2,
          rect.y + rect.height / 2,
          rect.width,
          rect.height,
          BELT.panelFill,
          BELT.panelFillAlpha,
        )
        .setStrokeStyle(BELT.panelStrokeWidth, BELT.panelStroke)
        .setDepth(DEPTH.track),
    );
    this.header = this.track(
      scene.add
        .text(rect.x + rect.width / 2, rect.y + BELT.headerInset, '', {
          ...TEXT_STYLE,
          fontSize: BELT.headerFontSize,
        })
        .setOrigin(0.5, 0)
        .setDepth(DEPTH.slot),
    );
    this.stats = this.track(
      scene.add
        .text(
          rect.x + rect.width / 2,
          rect.y + rect.height - BELT.footerHeight / 2,
          '',
          { ...TEXT_STYLE, fontSize: BELT.statsFontSize },
        )
        .setOrigin(0.5)
        .setDepth(DEPTH.slot),
    );
    this.drawFlowArrows();

    this.spots = layoutSlots(rect, buffer, {
      padding: BELT.padding,
      gap: BELT.gap,
      maxSize: BELT.maxSlotSize,
      headerHeight: BELT.headerHeight,
      footerHeight: BELT.footerHeight,
    });
    const hasTexture = scene.textures.exists(TINY_FACTORY.key);
    for (const spot of this.spots) {
      const box = this.track(
        scene.add
          .rectangle(spot.x, spot.y, spot.size, spot.size, BELT.slotEmpty)
          .setStrokeStyle(BELT.slotStrokeWidth, BELT.slotStroke)
          .setDepth(DEPTH.segment),
      );
      const crate = hasTexture
        ? this.track(
            scene.add
              .image(spot.x, spot.y, TINY_FACTORY.key, TINY_FRAMES.crate)
              .setDisplaySize(spot.size * 0.8, spot.size * 0.8)
              .setDepth(DEPTH.slot),
          )
        : null;
      this.slots.push({ box, crate });
    }
    this.update(buffer, [], 0);
  }

  /**
   * Memperbarui isi ban dari snapshot. `events` hanya memicu efek bila
   * array-nya baru (controller memakai ulang array yang sama untuk
   * notifikasi non-tick seperti ganti kecepatan).
   */
  update(
    buffer: BufferSnapshot,
    events: readonly SimEvent[],
    durationMs: number,
  ): void {
    const labels = describeBuffer(buffer);
    this.header.setText(labels.header);
    this.stats
      .setText(labels.stats)
      .setColor(labels.hasProblem ? BELT.warnText : COLORS.text);
    this.panel.setStrokeStyle(
      BELT.panelStrokeWidth,
      labels.hasProblem ? BELT.panelProblemStroke : BELT.panelStroke,
    );

    const items = Math.max(0, Math.min(buffer.items, this.slots.length));
    this.slots.forEach((slot, index) => {
      const isFilled = index >= this.slots.length - items;
      slot.box.setFillStyle(isFilled ? BELT.slotFilled : BELT.slotEmpty);
      slot.crate?.setVisible(isFilled);
    });

    if (events === this.lastEvents) return;
    this.lastEvents = events;
    const flash = bufferFlash(events, this.bufferId);
    if (flash.put) this.playPut(items, durationMs);
    if (flash.taken) this.playTaken(durationMs);
    if (flash.overflow) this.playOverflow(durationMs);
    if (flash.underflow) this.playUnderflow(durationMs);
  }

  destroy(): void {
    for (const effect of this.effects) {
      this.scene.tweens.killTweensOf(effect);
      effect.destroy();
    }
    this.effects.clear();
    for (const object of this.objects) object.destroy();
    this.objects.length = 0;
  }

  private get reduceMotion(): boolean {
    return this.scene.registry.get(REDUCE_MOTION_KEY) === true;
  }

  /** Deretan panah kecil kiri ke kanan: arah barang mengalir (statis, bukan animasi). */
  private drawFlowArrows(): void {
    const { rect } = this;
    const g = this.scene.add.graphics().setDepth(DEPTH.segment);
    g.fillStyle(BELT.arrowColor, BELT.arrowAlpha);
    const size = BELT.arrowSize;
    const y = rect.y + rect.height - BELT.footerHeight - BELT.arrowInset;
    const from = rect.x + BELT.padding + size;
    const to = rect.x + rect.width - BELT.padding - size;
    for (let x = from; x <= to; x += BELT.arrowGap) {
      g.fillTriangle(x + size, y, x - size, y - size, x - size, y + size);
    }
    this.track(g);
  }

  /** Peti sementara (gambar peti, atau kotak bila tekstur belum ada). */
  private makeCrate(
    x: number,
    y: number,
    size: number,
  ): GameObjects.Image | GameObjects.Rectangle {
    const crate = this.scene.textures.exists(TINY_FACTORY.key)
      ? this.scene.add
          .image(x, y, TINY_FACTORY.key, TINY_FRAMES.crate)
          .setDisplaySize(size, size)
      : this.scene.add.rectangle(x, y, size, size, BELT.slotFilled);
    return crate.setDepth(DEPTH.robotFx);
  }

  /** Peti meluncur dari ujung producer (kiri) ke slot terisi paling kiri. */
  private playPut(items: number, durationMs: number): void {
    const target = this.spots[this.spots.length - items];
    const first = this.spots[0];
    if (this.reduceMotion || target === undefined || first === undefined) {
      return;
    }
    const size = target.size * 0.8;
    const startX = this.rect.x + BELT.padding;
    const crate = this.makeCrate(startX, target.y, size);
    this.effects.add(crate);
    this.scene.tweens.add({
      targets: crate,
      x: target.x,
      duration: Math.max(durationMs, BELT.minFxMs),
      onComplete: () => {
        this.effects.delete(crate);
        crate.destroy();
      },
    });
  }

  /** Peti meluncur keluar dari ujung consumer (kanan) lalu memudar. */
  private playTaken(durationMs: number): void {
    const last = this.spots[this.spots.length - 1];
    if (this.reduceMotion || last === undefined) return;
    const size = last.size * 0.8;
    const crate = this.makeCrate(last.x, last.y, size);
    this.fade(
      crate,
      { x: this.rect.x + this.rect.width + size },
      durationMs,
    );
  }

  /** Peti jatuh dari ujung producer (kiri) keluar dari ban. */
  private playOverflow(durationMs: number): void {
    const first = this.spots[0];
    if (this.reduceMotion || first === undefined) return;
    const size = first.size * 0.8;
    const crate = this.makeCrate(first.x, first.y, size);
    const label = this.scene.add
      .text(first.x, first.y - first.size, 'OVERFLOW!', {
        ...TEXT_STYLE,
        fontSize: BELT.fxFontSize,
        color: BELT.warnText,
      })
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.robotFx);
    this.fade(crate, { y: first.y + BELT.fallDistance }, durationMs);
    this.fade(label, {}, durationMs);
  }

  /** Teks tangan meraih kosong di ujung consumer (kanan). */
  private playUnderflow(durationMs: number): void {
    const last = this.spots[this.spots.length - 1];
    if (this.reduceMotion || last === undefined) return;
    const label = this.scene.add
      .text(last.x, last.y - last.size, 'TANGAN KOSONG!', {
        ...TEXT_STYLE,
        fontSize: BELT.fxFontSize,
        color: BELT.warnText,
      })
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.robotFx);
    this.fade(label, {}, durationMs);
  }

  private fade(
    target: GameObjects.GameObject,
    props: { x?: number; y?: number },
    durationMs: number,
  ): void {
    this.effects.add(target);
    this.scene.tweens.add({
      targets: target,
      alpha: 0,
      ...props,
      duration: Math.max(durationMs, BELT.minFxMs),
      onComplete: () => {
        this.effects.delete(target);
        target.destroy();
      },
    });
  }

  private track<T extends GameObjects.GameObject>(object: T): T {
    this.objects.push(object);
    return object;
  }
}