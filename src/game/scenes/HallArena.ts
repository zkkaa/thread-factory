import type { Scene } from 'phaser';
import type { Snapshot, ThreadDef } from '../../engine/types';
import type { LevelDefinition } from '../../levels/types';
import { robotFrameFor } from '../assetManifest';
import { assignHallSpots, hallRobots } from '../hallSpots';
import type { HallLayout } from '../layouts/types';
import { HallRobotView } from '../views/HallRobotView';
import { HallView } from '../views/HallView';
import { TokenView } from '../views/TokenView';

/**
 * Arena jenis aula (Level 1-3), dipakai LevelScene bila layout berjenis 'hall'.
 * Posisi robot dipilih fungsi murni di hallSpots.ts dari program efektif dan
 * snapshot; kelas ini hanya menyalurkannya ke view. Tidak ada aturan permainan
 * di sini: bentrok dan jumlah di aula berasal dari engine.
 */
export class HallArena {
  private readonly view: HallView;
  private readonly robots: HallRobotView[];
  private readonly token: TokenView | null;
  private readonly capacity: number;
  /** Kursi aula pada pembaruan sebelumnya, supaya robot tidak berpindah mesin. */
  private seats: ReadonlyMap<string, number> = new Map();

  constructor(
    scene: Scene,
    private readonly layout: HallLayout,
    level: LevelDefinition,
    snapshot: Readonly<Snapshot>,
    private readonly effective: readonly ThreadDef[],
    gated: boolean,
  ) {
    this.capacity = level.areas?.[layout.area] ?? layout.machines.length;
    this.view = new HallView(scene, layout, gated);

    const placement = this.placement(snapshot);
    this.seats = placement.seats;
    this.robots = snapshot.threads.map((thread, index) => {
      const totalRounds =
        level.threads.find((def) => def.id === thread.id)?.repeat ?? 1;
      return new HallRobotView(scene, thread, {
        start: placement.spots.get(thread.id) ?? layout.door,
        spriteFrame: robotFrameFor(index),
        totalRounds,
      });
    });

    const sem = snapshot.semaphores[0];
    this.token =
      sem === undefined
        ? null
        : new TokenView(scene, sem.id, {
            x: layout.tokenRack.x,
            y: layout.tokenRack.y,
            label:
              level.resources.find((r) => r.id === sem.id)?.label ??
              'Kartu Akses',
          });
    this.update(snapshot, 0);
  }

  /** Memindahkan robot dan memperbarui hitungan aula, gerbang, dan rak kartu. */
  update(snapshot: Readonly<Snapshot>, durationMs: number): void {
    const { spots, seats, overflow, active } = this.placement(snapshot);
    this.seats = seats;

    snapshot.threads.forEach((thread, index) => {
      const robot = this.robots[index];
      if (robot === undefined) return;
      const spot = spots.get(thread.id);
      if (spot !== undefined) robot.moveTo(spot, durationMs);
      robot.update(thread, overflow.has(thread.id));
    });

    const sem = snapshot.semaphores[0];
    this.view.update({
      occupancy: snapshot.areaOccupancy[this.layout.area] ?? 0,
      capacity: this.capacity,
      cards: sem?.value ?? null,
      activeMachines: active,
    });
    if (sem !== undefined) {
      const names = new Map(snapshot.threads.map((t) => [t.id, t.label]));
      this.token?.updateSnapshot(sem, (id) => names.get(id) ?? id);
    }
  }

  destroy(): void {
    for (const robot of this.robots) robot.destroy();
    this.view.destroy();
    this.token?.destroy();
  }

  private placement(snapshot: Readonly<Snapshot>) {
    const entries = hallRobots(
      this.effective,
      snapshot.threads,
      this.layout.area,
    );
    const waitingOrder = snapshot.semaphores.flatMap((sem) => sem.queue);
    const { spots, seats } = assignHallSpots(
      this.layout,
      entries,
      waitingOrder,
      this.seats,
    );
    const machineCount = this.layout.machines.length;
    const overflow = new Set<string>();
    const active = new Set<number>();
    for (const [id, seat] of seats) {
      if (seat >= machineCount) overflow.add(id);
      else active.add(seat);
    }
    return { spots, seats, overflow, active };
  }
}
