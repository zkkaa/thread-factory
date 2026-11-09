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
 * Overflow tampil sebagai peti jatuh di ujung producer (kiri), underflow
 * sebagai teks "TANGAN KOSONG" di ujung consumer (kanan). Hitungan overflow
 * dan underflow selalu tampil sebagai teks; gerak dimatikan oleh "kurangi
 * animasi". View ini hanya menggambar apa yang dilaporkan engine.
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
    rect: Rect,
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

    this.slots.forEach((slot, index) => {
      const filled = this.spots[index]?.filled ?? false;
      const items = Math.max(0, Math.min(buffer.items, this.slots.length));
      const isFilled = index >= this.slots.length - items;
      void filled;
      slot.box.setFillStyle(isFilled ? BELT.slotFilled : BELT.slotEmpty);
      slot.crate?.setVisible(isFilled);
    });

    if (events === this.lastEvents) return;
    this.lastEvents = events;
    const flash = bufferFlash(events, this.bufferId);
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

  /** Peti jatuh dari ujung producer (kiri) keluar dari ban. */
  private playOverflow(durationMs: number): void {
    const first = this.spots[0];
    if (this.reduceMotion || first === undefined) return;
    const size = first.size * 0.8;
    const crate = this.scene.textures.exists(TINY_FACTORY.key)
      ? this.scene.add
          .image(first.x, first.y, TINY_FACTORY.key, TINY_FRAMES.crate)
          .setDisplaySize(size, size)
      : this.scene.add.rectangle(
          first.x,
          first.y,
          size,
          size,
          BELT.panelProblemStroke,
        );
    crate.setDepth(DEPTH.robotFx);
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
    props: { y?: number },
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
