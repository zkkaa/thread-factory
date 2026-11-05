import type { Scene } from 'phaser';
import type { Snapshot } from '../../engine/types';
import type { LevelDefinition } from '../../levels/types';
import { robotFrameFor } from '../assetManifest';
import type { TableLayout } from '../layouts/types';
import { deriveTableState } from '../tableState';
import { BatteryMeter } from '../views/BatteryMeter';
import { HallRobotView } from '../views/HallRobotView';
import { TableView } from '../views/TableView';

/**
 * Arena meja barang (Level 1-4), dipakai LevelScene bila layout berjenis
 * 'table'. Memakai ulang HallRobotView dan BatteryMeter; keadaan meja berasal
 * dari deriveTableState (murni). Tidak ada aturan permainan di sini.
 */
export class TableArena {
  private readonly view: TableView;
  private readonly assembler: HallRobotView;
  private readonly packer: HallRobotView;
  private readonly battery: BatteryMeter;
  private readonly assemblerIndex: number;
  private readonly packerIndex: number;
  private readonly variable: string;
  private readonly target: number;

  constructor(
    scene: Scene,
    private readonly layout: TableLayout,
    level: LevelDefinition,
    snapshot: Readonly<Snapshot>,
  ) {
    this.variable = level.goal.target.variable;
    this.target = level.goal.target.value;
    this.view = new TableView(scene, layout);

    this.assemblerIndex = this.indexOf(snapshot, layout.assemblerId);
    this.packerIndex = this.indexOf(snapshot, layout.packerId);
    const make = (index: number, at: TableLayout['assemblerSpot']) => {
      const thread = snapshot.threads[index];
      if (thread === undefined) throw new Error('Thread tidak ada.');
      return new HallRobotView(scene, thread, {
        start: at,
        spriteFrame: robotFrameFor(index),
        totalRounds:
          level.threads.find((def) => def.id === thread.id)?.repeat ?? 1,
      });
    };
    this.assembler = make(this.assemblerIndex, layout.assemblerSpot);
    this.packer = make(this.packerIndex, layout.packerSpot);
    this.battery = new BatteryMeter(
      scene,
      layout.battery.x,
      layout.battery.y,
      1,
    );
    this.update(snapshot);
  }

  update(snapshot: Readonly<Snapshot>): void {
    const assembler = snapshot.threads[this.assemblerIndex];
    const packer = snapshot.threads[this.packerIndex];
    if (assembler !== undefined) this.assembler.update(assembler, false);
    if (packer !== undefined) this.packer.update(packer, false);

    const state = deriveTableState(
      snapshot,
      this.layout.packerId,
      this.variable,
      this.target,
    );
    this.view.update(state);
    this.battery.update(state.battery);
  }

  destroy(): void {
    this.assembler.destroy();
    this.packer.destroy();
    this.battery.destroy();
    this.view.destroy();
  }

  private indexOf(snapshot: Readonly<Snapshot>, id: string): number {
    const index = snapshot.threads.findIndex((thread) => thread.id === id);
    if (index < 0) throw new Error(`Thread "${id}" tidak ada di snapshot.`);
    return index;
  }
}
