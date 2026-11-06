import type { Scene } from 'phaser';
import type { SimEvent, Snapshot } from '../../engine/types';
import type { LevelDefinition } from '../../levels/types';
import { robotFrameFor } from '../assetManifest';
import { deriveDeskState, sawSignal } from '../deskState';
import type { DeskLayout } from '../layouts/types';
import { BatteryMeter } from '../views/BatteryMeter';
import { DeskView } from '../views/DeskView';
import { HallRobotView } from '../views/HallRobotView';

/**
 * Arena meja barang (Level 1-4), dipakai LevelScene bila layout berjenis
 * 'desk'. Memakai ulang HallRobotView dan BatteryMeter; keadaan meja berasal
 * dari deriveDeskState (murni). Lampu hijau begitu event COND_SIGNAL terlihat
 * dan tetap hijau sampai arena dibangun ulang (Reset atau alat berubah).
 * Tidak ada aturan permainan di sini.
 */
export class DeskArena {
  private readonly view: DeskView;
  private readonly assembler: HallRobotView;
  private readonly packer: HallRobotView;
  private readonly battery: BatteryMeter;
  private readonly assemblerIndex: number;
  private readonly packerIndex: number;
  private readonly variable: string;
  private readonly target: number;
  private signaled = false;

  constructor(
    scene: Scene,
    private readonly layout: DeskLayout,
    level: LevelDefinition,
    snapshot: Readonly<Snapshot>,
  ) {
    this.variable = level.goal.target.variable;
    this.target = level.goal.target.value;
    this.view = new DeskView(scene, layout);
    this.assemblerIndex = this.indexOf(snapshot, layout.assemblerId);
    this.packerIndex = this.indexOf(snapshot, layout.packerId);
    const make = (index: number, at: DeskLayout['assemblerSpot']) => {
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

  update(
    snapshot: Readonly<Snapshot>,
    events: readonly SimEvent[] = [],
  ): void {
    if (!this.signaled && sawSignal(events)) this.signaled = true;
    const assembler = snapshot.threads[this.assemblerIndex];
    const packer = snapshot.threads[this.packerIndex];
    if (assembler !== undefined) this.assembler.update(assembler, false);
    if (packer !== undefined) this.packer.update(packer, false);
    const state = deriveDeskState(
      snapshot,
      this.layout.packerId,
      this.variable,
      this.target,
      this.signaled,
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