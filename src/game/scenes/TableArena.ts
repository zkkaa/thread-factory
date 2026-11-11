import type { GameObjects, Scene } from 'phaser';
import type { Snapshot } from '../../engine/types';
import type { ThreadDef } from '../../engine/types';
import { robotFrameFor } from '../assetManifest';
import type { Point, TableLayout } from '../layouts/types';
import { DEPTH, TABLE, TEXT_STYLE } from '../theme';
import { getThreadStepProgress } from '../tableProgress';
import { HallRobotView } from '../views/HallRobotView';

interface ForkView {
  id: string;
  dot: GameObjects.Arc;
  label: GameObjects.Text;
}

interface ProgressView {
  track: GameObjects.Arc;
  fill: GameObjects.Arc;
  label: GameObjects.Text;
}

/**
 * Arena meja bundar (Level 2-3), dipakai LevelScene bila layout berjenis 'table'.
 * Teknisi diam di kursinya (memakai ulang HallRobotView); yang berubah adalah
 * status teknisi, warna dan teks tiap kunci, garis dari kunci ke pemegangnya,
 * cincin progres langkah, dan spanduk DEADLOCK. Semua nilai berasal dari
 * snapshot engine; tidak ada aturan permainan di sini.
 */
export class TableArena {
  private readonly robots: HallRobotView[];
  private readonly progress = new Map<string, ProgressView>();
  private readonly threadDefs: ReadonlyMap<string, ThreadDef>;
  private readonly forks: ForkView[] = [];
  private readonly objects: GameObjects.GameObject[] = [];
  private readonly links: GameObjects.Graphics;
  private readonly banner: GameObjects.Text;

  constructor(
    scene: Scene,
    private readonly layout: TableLayout,
    threads: readonly ThreadDef[],
    snapshot: Readonly<Snapshot>,
  ) {
    this.threadDefs = new Map(threads.map((thread) => [thread.id, thread]));
    const { center, radius } = layout.table;
    this.objects.push(
      scene.add
        .circle(
          center.x,
          center.y,
          radius,
          TABLE.tableFill,
          TABLE.tableFillAlpha,
        )
        .setStrokeStyle(TABLE.tableStrokeWidth, TABLE.tableStroke)
        .setDepth(DEPTH.track),
      scene.add
        .text(center.x, center.y, 'Meja Teknisi', {
          ...TEXT_STYLE,
          fontSize: TABLE.titleFontSize,
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.track),
    );

    this.links = scene.add.graphics().setDepth(DEPTH.segment);

    layout.forks.forEach((p, i) => {
      const dot = scene.add
        .circle(p.x, p.y, TABLE.forkRadius, TABLE.forkFree)
        .setStrokeStyle(TABLE.forkStrokeWidth, TABLE.forkStroke)
        .setDepth(DEPTH.gate);
      const label = scene.add
        .text(p.x, p.y + TABLE.forkLabelGap, '', {
          ...TEXT_STYLE,
          fontSize: TABLE.forkFontSize,
        })
        .setOrigin(0.5, 0)
        .setDepth(DEPTH.gate);
      this.forks.push({ id: layout.forkIds[i] ?? '', dot, label });
    });

    this.banner = scene.add
      .text(center.x, TABLE.bannerY, 'DEADLOCK! Semua teknisi saling menunggu', {
        ...TEXT_STYLE,
        fontSize: TABLE.bannerFontSize,
        color: TABLE.bannerText,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.robotFx)
      .setVisible(false);

    this.robots = snapshot.threads.map((thread, index) => {
      const seat = this.seatOf(thread.id) ?? layout.seats[index] ?? center;
      const definition = this.threadDefinition(thread.id);
      this.createProgressView(scene, thread.id, seat, definition, thread);
      return new HallRobotView(scene, thread, {
        start: seat,
        spriteFrame: robotFrameFor(index),
        totalRounds: definition.repeat ?? 1,
      });
    });

    this.update(snapshot);
  }

  /** Memperbarui teknisi, kunci, garis pemegang, dan spanduk dari snapshot. */
  update(snapshot: Readonly<Snapshot>): void {
    snapshot.threads.forEach((thread, index) => {
      this.robots[index]?.update(thread, false);
      const view = this.progress.get(thread.id);
      if (view === undefined) return;

      const { completedSteps, totalSteps, fraction } = getThreadStepProgress(
        thread,
        this.threadDefinition(thread.id),
      );
      view.fill.setEndAngle(-90 + 360 * fraction);
      view.label.setText(`Langkah ${completedSteps}/${totalSteps}`);
    });

    const names = new Map(snapshot.threads.map((t) => [t.id, t.label]));
    this.links.clear();
    this.links.lineStyle(TABLE.linkWidth, TABLE.forkHeld, TABLE.linkAlpha);

    this.forks.forEach((fork, i) => {
      const mutex = snapshot.mutexes.find((m) => m.id === fork.id);
      const owner = mutex?.owner ?? null;
      const number = i + 1;
      fork.dot.setFillStyle(owner === null ? TABLE.forkFree : TABLE.forkHeld);
      fork.label.setText(
        owner === null
          ? `Kunci ${number}\nBEBAS`
          : `Kunci ${number}\nDipegang ${names.get(owner) ?? owner}`,
      );
      const seat = owner === null ? undefined : this.seatOf(owner);
      const spot = this.layout.forks[i];
      if (seat !== undefined && spot !== undefined) {
        this.links.lineBetween(spot.x, spot.y, seat.x, seat.y);
      }
    });

    this.banner.setVisible(Boolean(snapshot.deadlock));
  }

  destroy(): void {
    for (const robot of this.robots) robot.destroy();
    for (const view of this.progress.values()) {
      view.track.destroy();
      view.fill.destroy();
      view.label.destroy();
    }
    this.progress.clear();
    for (const fork of this.forks) {
      fork.dot.destroy();
      fork.label.destroy();
    }
    for (const object of this.objects) object.destroy();
    this.objects.length = 0;
    this.links.destroy();
    this.banner.destroy();
  }

  private seatOf(threadId: string): Point | undefined {
    const index = this.layout.seatIds.indexOf(threadId);
    return index < 0 ? undefined : this.layout.seats[index];
  }

  private threadDefinition(threadId: string): ThreadDef {
    const definition = this.threadDefs.get(threadId);
    if (definition === undefined) {
      throw new Error(`Definisi teknisi "${threadId}" tidak ditemukan.`);
    }
    return definition;
  }

  private createProgressView(
    scene: Scene,
    threadId: string,
    seat: Point,
    definition: ThreadDef,
    thread: Snapshot['threads'][number],
  ): void {
    const track = scene.add
      .arc(seat.x, seat.y, TABLE.progressRadius, -90, 270)
      .setFillStyle(TABLE.progressTrack, 0)
      .setStrokeStyle(TABLE.progressStrokeWidth, TABLE.progressTrack)
      .setDepth(DEPTH.robotGlow + 0.3);
    const { fraction, completedSteps, totalSteps } = getThreadStepProgress(
      thread,
      definition,
    );
    const fill = scene.add
      .arc(
        seat.x,
        seat.y,
        TABLE.progressRadius,
        -90,
        -90 + 360 * fraction,
      )
      .setFillStyle(TABLE.progressFill, 0)
      .setStrokeStyle(TABLE.progressStrokeWidth, TABLE.progressFill)
      .setDepth(DEPTH.robotGlow + 0.4);
    const label = scene.add
      .text(
        seat.x,
        seat.y - TABLE.progressRadius - TABLE.progressLabelGap,
        `Langkah ${completedSteps}/${totalSteps}`,
        { ...TEXT_STYLE, fontSize: TABLE.progressFontSize },
      )
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.robotLabel);

    this.progress.set(threadId, { track, fill, label });
  }
}