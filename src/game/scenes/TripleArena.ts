import type { Scene } from 'phaser';
import type { SimEvent, Snapshot, ThreadDef } from '../../engine/types';
import type { LevelDefinition } from '../../levels/types';
import type { TripleLayout } from '../layouts/types';
import { BeltArena } from './BeltArena';
import { BoardArena } from './BoardArena';
import { TableArena } from './TableArena';

/**
 * Arena Level 2-4: merangkai BeltArena, BoardArena, dan TableArena. Ketiganya
 * mengambil robot berdasarkan urutan thread di snapshot, jadi tiap arena
 * diberi snapshot yang hanya berisi thread miliknya (urutan tetap).
 * Tidak ada aturan permainan di sini, hanya pembagian data untuk digambar.
 */
export class TripleArena {
  private readonly beltIds: ReadonlySet<string>;
  private readonly boardIds: ReadonlySet<string>;
  private readonly tableIds: ReadonlySet<string>;
  private readonly belt: BeltArena;
  private readonly board: BoardArena;
  private readonly table: TableArena;

  constructor(
    scene: Scene,
    layout: TripleLayout,
    level: LevelDefinition,
    snapshot: Readonly<Snapshot>,
    effective: readonly ThreadDef[],
  ) {
    this.beltIds = new Set([
      ...layout.belt.producerIds,
      ...layout.belt.consumerIds,
    ]);
    this.boardIds = new Set([
      ...layout.board.readerIds,
      ...layout.board.writerIds,
    ]);
    this.tableIds = new Set(layout.table.seatIds);

    this.belt = new BeltArena(
      scene,
      layout.belt,
      level,
      this.part(snapshot, this.beltIds),
    );
    this.board = new BoardArena(
      scene,
      layout.board,
      level,
      this.part(snapshot, this.boardIds),
    );
    this.table = new TableArena(
      scene,
      layout.table,
      effective.filter((thread) => this.tableIds.has(thread.id)),
      this.part(snapshot, this.tableIds),
    );
  }

  update(
    snapshot: Readonly<Snapshot>,
    events: readonly SimEvent[],
    durationMs: number,
  ): void {
    this.belt.update(this.part(snapshot, this.beltIds), events, durationMs);
    this.board.update(this.part(snapshot, this.boardIds));
    this.table.update(this.part(snapshot, this.tableIds));
  }

  destroy(): void {
    this.belt.destroy();
    this.board.destroy();
    this.table.destroy();
  }

  private part(
    snapshot: Readonly<Snapshot>,
    ids: ReadonlySet<string>,
  ): Readonly<Snapshot> {
    return {
      ...snapshot,
      threads: snapshot.threads.filter((thread) => ids.has(thread.id)),
    };
  }
}
