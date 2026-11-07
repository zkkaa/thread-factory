import { GameObjects, Scene } from 'phaser';
import type { SimEvent, Snapshot } from '../../engine/types';
import type { LevelDefinition } from '../../levels/types';
import { robotFrameFor } from '../assetManifest';
import type { BeltLayout, Rect } from '../layouts/types';
import { COLORS, DEPTH, HALL, TEXT_STYLE } from '../theme';
import { BufferView } from '../views/BufferView';
import { HallRobotView } from '../views/HallRobotView';

/**
 * Arena ban berjalan (Level 2-1), dipakai LevelScene bila layout berjenis
 * 'belt'. Menyalurkan snapshot dan event ke BufferView dan keempat robot.
 * Tidak ada aturan permainan di sini: overflow dan underflow datang dari engine.
 */
export class BeltArena {
  private readonly objects: GameObjects.GameObject[] = [];
  private readonly robots: { index: number; view: HallRobotView }[] = [];
  private readonly buffer: BufferView;
  private readonly bufferId: string;

  constructor(
    scene: Scene,
    layout: BeltLayout,
    level: LevelDefinition,
    snapshot: Readonly<Snapshot>,
  ) {
    this.bufferId = layout.bufferId;
    this.zone(scene, layout.producerZone, 'Area Perakit');
    this.zone(scene, layout.consumerZone, 'Area Pengepak');

    const bufferSnap = snapshot.buffers.find((b) => b.id === layout.bufferId);
    if (bufferSnap === undefined) {
      throw new Error(`Ban "${layout.bufferId}" tidak ada di snapshot.`);
    }
    this.buffer = new BufferView(scene, layout.belt, bufferSnap);

    const place = (
      ids: readonly string[],
      spots: BeltLayout['producerSpots'],
    ) =>
      ids.forEach((id, i) => {
        const index = snapshot.threads.findIndex((t) => t.id === id);
        const thread = snapshot.threads[index];
        const spot = spots[i];
        if (thread === undefined || spot === undefined) return;
        this.robots.push({
          index,
          view: new HallRobotView(scene, thread, {
            start: spot,
            spriteFrame: robotFrameFor(index),
            totalRounds: level.threads.find((d) => d.id === id)?.repeat ?? 1,
          }),
        });
      });
    place(layout.producerIds, layout.producerSpots);
    place(layout.consumerIds, layout.consumerSpots);
    this.update(snapshot, [], 0);
  }

  update(
    snapshot: Readonly<Snapshot>,
    events: readonly SimEvent[],
    durationMs: number,
  ): void {
    for (const { index, view } of this.robots) {
      const thread = snapshot.threads[index];
      if (thread !== undefined) view.update(thread, false);
    }
    const bufferSnap = snapshot.buffers.find((b) => b.id === this.bufferId);
    if (bufferSnap !== undefined) {
      this.buffer.update(bufferSnap, events, durationMs);
    }
  }

  destroy(): void {
    for (const { view } of this.robots) view.destroy();
    this.buffer.destroy();
    for (const object of this.objects) object.destroy();
    this.objects.length = 0;
  }

  private zone(scene: Scene, rect: Rect, title: string): void {
    this.objects.push(
      scene.add
        .rectangle(
          rect.x + rect.width / 2,
          rect.y + rect.height / 2,
          rect.width,
          rect.height,
          HALL.zoneFill,
          HALL.zoneFillAlpha,
        )
        .setStrokeStyle(HALL.zoneStrokeWidth, HALL.zoneStroke)
        .setDepth(DEPTH.track),
      scene.add
        .text(rect.x + rect.width / 2, rect.y + HALL.zoneTitleInset, title, {
          ...TEXT_STYLE,
          fontSize: HALL.titleFontSize,
          color: COLORS.text,
        })
        .setOrigin(0.5, 0)
        .setDepth(DEPTH.slot),
    );
  }
}
