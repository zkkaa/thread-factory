import type { Scene } from 'phaser';
import type { Snapshot, ThreadDef } from '../../engine/types';
import type { LevelDefinition } from '../../levels/types';
import { robotFrameFor } from '../assetManifest';
import { assignHallSpots, hallRobots } from '../hallSpots';
import { planMove, type HallPlace } from '../hallRoute';
import type { HallLayout } from '../layouts/types';
import { HallRobotView } from '../views/HallRobotView';
import { HallView } from '../views/HallView';
import { TokenView } from '../views/TokenView';

/**
 * Arena jenis aula (Level 1-3), dipakai LevelScene bila layout berjenis 'hall'.
 * Posisi robot dipilih fungsi murni di hallSpots.ts dari program efektif dan
 * snapshot; cara berpindahnya (jalan, atau memudar lalu muncul) dipilih
 * hallRoute.ts. Kelas ini hanya menyalurkannya ke view. Tidak ada aturan
 * permainan di sini: bentrok dan jumlah di aula berasal dari engine.
 */
export class HallArena {
  private readonly view: HallView;
  private readonly robots: HallRobotView[];
  private readonly token: TokenView | null;
  private readonly capacity: number;
  /** Kursi aula pada pembaruan sebelumnya, supaya robot tidak berpindah mesin. */
  private seats: ReadonlyMap<string, number> = new Map();
  /** Zona dan titik tiap robot pada pembaruan sebelumnya. */
  private places = new Map<string, HallPlace>();

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
    this.places = placement.places;
    this.robots = snapshot.threads.map((thread, index) => {
      const totalRounds =
        level.threads.find((def) => def.id === thread.id)?.repeat ?? 1;
      return new HallRobotView(scene, thread, {
        start: placement.spots.get(thread.id) ?? layout.door,
        spriteFrame: robotFrameFor(index),
        totalRounds,
        compactLabel: layout.art !== undefined,
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
    const { places, seats, overflow, active } = this.placement(snapshot);
    const before = this.places;
    this.seats = seats;
    this.places = places;

    snapshot.threads.forEach((thread, index) => {
      const robot = this.robots[index];
      if (robot === undefined) return;
      const to = places.get(thread.id);
      if (to !== undefined) {
        const move = planMove(
          this.layout,
          before.get(thread.id) ?? null,
          to,
        );
        if (move.kind === 'walk') robot.walk(move.points, durationMs);
        else if (move.kind === 'respawn') robot.respawn(to.point, durationMs);
      }
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
    const places = new Map<string, HallPlace>();
    for (const entry of entries) {
      const point = spots.get(entry.id);
      if (point !== undefined) places.set(entry.id, { zone: entry.zone, point });
    }
    return { spots, places, seats, overflow, active };
  }
}