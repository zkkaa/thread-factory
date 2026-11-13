import type { GameObjects, Scene } from 'phaser';
import type { Snapshot } from '../../engine/types';
import type { LevelDefinition } from '../../levels/types';
import { robotFrameFor } from '../assetManifest';
import type { BoardLayout, Point, Rect } from '../layouts/types';
import { BULLETIN, COLORS, DEPTH, HALL, TEXT_STYLE } from '../theme';
import { HallRobotView } from '../views/HallRobotView';

const POLICY_LABEL = {
  reader: 'Utamakan Pembaca',
  writer: 'Utamakan Penulis',
  fair: 'Adil (FIFO)',
} as const;

/**
 * Arena papan pengumuman (Level 2-2), dipakai LevelScene bila layout berjenis
 * 'board'. Robot diam di titiknya; papan menampilkan versi, bacaan setengah
 * jadi, tabrakan tulis, kondisi kunci, dan waktu tunggu penulis. Semua angka
 * dari snapshot engine; tidak ada aturan permainan di sini.
 */
export class BoardArena {
  private readonly objects: GameObjects.GameObject[] = [];
  private readonly robots: { index: number; view: HallRobotView }[] = [];
  private readonly panel: GameObjects.Rectangle;
  private readonly body: GameObjects.Text;
  private readonly banner: GameObjects.Text;

  constructor(
    scene: Scene,
    private readonly layout: BoardLayout,
    level: LevelDefinition,
    snapshot: Readonly<Snapshot>,
  ) {
    this.zone(scene, layout.readerZone, 'Pembaca');
    this.zone(scene, layout.writerZone, 'Penulis');

    const { board } = layout;
    const cx = board.x + board.width / 2;
    this.panel = scene.add
      .rectangle(
        cx,
        board.y + board.height / 2,
        board.width,
        board.height,
        BULLETIN.panelFill,
        BULLETIN.panelFillAlpha,
      )
      .setStrokeStyle(BULLETIN.panelStrokeWidth, BULLETIN.panelStroke)
      .setDepth(DEPTH.track);
    this.objects.push(
      this.panel,
      scene.add
        .text(cx, board.y + BULLETIN.titleInset, 'Papan Pengumuman', {
          ...TEXT_STYLE,
          fontSize: BULLETIN.titleFontSize,
        })
        .setOrigin(0.5, 0)
        .setDepth(DEPTH.slot),
    );
    this.body = scene.add
      .text(board.x + 20, board.y + BULLETIN.bodyInset, '', {
        ...TEXT_STYLE,
        fontSize: BULLETIN.bodyFontSize,
        align: 'left',
        wordWrap: { width: board.width - 40 },
      })
      .setDepth(DEPTH.slot);
    this.banner = scene.add
      .text(cx, board.y - BULLETIN.bannerGap, '', {
        ...TEXT_STYLE,
        fontSize: BULLETIN.bannerFontSize,
        color: BULLETIN.warnText,
      })
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.robotFx);
    this.objects.push(this.body, this.banner);

    const place = (ids: readonly string[], spots: readonly Point[]): void =>
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
    place(layout.readerIds, layout.readerSpots);
    place(layout.writerIds, layout.writerSpots);
    this.update(snapshot);
  }

  update(snapshot: Readonly<Snapshot>): void {
    for (const { index, view } of this.robots) {
      const thread = snapshot.threads[index];
      if (thread !== undefined) view.update(thread, false);
    }

    const board = snapshot.boards.find((b) => b.id === this.layout.boardId);
    const lock = snapshot.rwLocks[0];
    const names = new Map(snapshot.threads.map((t) => [t.id, t.label]));
    const nameOf = (id: string): string => names.get(id) ?? id;

    const limit = snapshot.starvationTicks ?? null;
    const streaks = snapshot.waitStreaks ?? {};
    const writerStreak = Math.max(
      0,
      ...this.layout.writerIds.map((id) => streaks[id] ?? 0),
    );
    const starving = limit !== null && writerStreak >= limit;
    const torn = (board?.inconsistentReads ?? 0) > 0;
    const conflict = (board?.writeConflicts ?? 0) > 0;

    const lines = [
      `Versi papan: ${board?.version ?? 0}`,
      `Penulis aktif: ${board?.activeWriters ?? 0}`,
      `Bacaan: ${board?.reads ?? 0} (setengah jadi: ${board?.inconsistentReads ?? 0})`,
      `Tabrakan tulis: ${board?.writeConflicts ?? 0}`,
      '',
      lock === undefined
        ? 'Kunci papan: belum dipasang'
        : `Kunci papan: ${POLICY_LABEL[lock.policy]}`,
    ];
    if (lock !== undefined) {
      lines.push(
        `Pembaca aktif: ${lock.readers.length === 0 ? '-' : lock.readers.map(nameOf).join(', ')}`,
        `Penulis aktif: ${lock.writer === null ? '-' : nameOf(lock.writer)}`,
        `Antre: ${lock.queue.length === 0 ? '-' : lock.queue.map((w) => nameOf(w.thread)).join(', ')}`,
      );
    }
    lines.push(
      '',
      limit === null
        ? `Penulis menunggu: ${writerStreak} tick`
        : `Penulis terlama menunggu: ${writerStreak} / ${limit} tick`,
    );
    this.body.setText(lines.join('\n'));

    const problem = torn || conflict || starving;
    this.panel.setStrokeStyle(
      BULLETIN.panelStrokeWidth,
      problem ? BULLETIN.panelProblemStroke : BULLETIN.panelStroke,
    );
    this.body.setColor(problem ? BULLETIN.warnText : COLORS.text);
    this.banner.setText(
      starving
        ? 'PENULIS KELAPARAN!'
        : torn
          ? 'DATA SETENGAH JADI TERBACA!'
          : conflict
            ? 'PENULIS BERTABRAKAN!'
            : '',
    );
  }

  destroy(): void {
    for (const { view } of this.robots) view.destroy();
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
        })
        .setOrigin(0.5, 0)
        .setDepth(DEPTH.slot),
    );
  }
}
