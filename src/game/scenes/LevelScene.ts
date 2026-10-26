import { GameObjects, Scene, Scenes } from 'phaser';
import { buildEngineConfig } from '../../controller/buildEngineConfig';
import {
  TICK_INTERVAL_MS,
  type ControllerState,
  type SimulationController,
} from '../../controller/SimulationController';
import type { SimEvent, Snapshot, ThreadId } from '../../engine/types';
import {
  ARENA,
  COLORS,
  DOOR_PANEL,
  TEXT_STYLE,
  TILE_SIZE,
  laneCenterY,
  tileCenterX,
} from '../theme';
import { BoardView } from '../views/BoardView';
import { DoorView, type DoorGate, type NameOf } from '../views/DoorView';
import { RobotView } from '../views/RobotView';

/** Data yang harus diberikan saat scene dimulai: scene.start('LevelScene', data). */
export interface LevelSceneData {
  controller: SimulationController;
}

/**
 * Scene arena satu level. Tugasnya hanya MENGGAMBAR dan MENGANIMASIKAN apa yang
 * dilaporkan controller; benar/salah, menang/kalah, dan metrik dihitung engine
 * (aturan arsitektur 3).
 *
 * Alurnya: controller memberi tahu scene lewat subscribe. Pada tick 0 (level
 * dimuat, Reset, atau alat berubah) semua view dibangun ulang dari snapshot.
 * Pada tick berikutnya, event INSTRUCTION menggerakkan robot ke ubinnya dan
 * snapshot memperbarui warna, label, nilai papan, dan status pintu.
 */
export class LevelScene extends Scene {
  private controller: SimulationController | null = null;
  private robots: RobotView[] = [];
  private doors: DoorView[] = [];
  private board: BoardView | null = null;
  private notice: GameObjects.Text | null = null;

  constructor() {
    super('LevelScene');
  }

  init(data: LevelSceneData): void {
    this.controller = data.controller;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    const controller = this.controller;
    if (controller === null) {
      this.showNotice('Controller belum diberikan ke scene');
      return;
    }

    this.showNotice('Level belum dimuat');
    this.handleState(controller.getState());
    const unsubscribe = controller.subscribe((state) =>
      this.handleState(state),
    );
    // Berhenti mendengarkan saat scene ditutup agar tidak ada listener yatim.
    this.events.once(Scenes.Events.SHUTDOWN, unsubscribe);
  }

  private handleState(state: ControllerState): void {
    const { level, snapshot } = state;
    if (level === null || snapshot === null) return;

    if (snapshot.tick === 0) {
      this.rebuild(state);
      return;
    }
    this.playEvents(state.events, TICK_INTERVAL_MS / state.speed);
    this.refresh(snapshot);
  }

  /**
   * Buang semua view lama lalu bangun ulang dari keadaan controller.
   * Program tiap jalur diambil dari konfigurasi engine (sudah memuat
   * LOCK/UNLOCK dari alat pemain), supaya ubinnya cocok dengan index event.
   */
  private rebuild(state: ControllerState): void {
    const { level, snapshot } = state;
    if (level === null || snapshot === null) return;

    this.destroyViews();
    const programs = buildEngineConfig(level, [...state.tools]).threads;
    const programOf = (id: ThreadId) =>
      programs.find((def) => def.id === id)?.program ?? [];
    const nameOf = this.nameOf(snapshot);

    this.board = new BoardView(this, snapshot.sharedVars, ARENA.width / 2, 80);
    this.robots = snapshot.threads.map((thread, laneIndex) => {
      return new RobotView(this, thread, programOf(thread.id), laneIndex);
    });

    this.doors = snapshot.mutexes.map((mutex, doorIndex) => {
      // Gerbang berada di tepi kanan setiap ubin LOCK untuk mutex ini.
      const gates: DoorGate[] = [];
      snapshot.threads.forEach((thread, laneIndex) => {
        programOf(thread.id).forEach((instruction, tileIndex) => {
          if (instruction.op === 'LOCK' && instruction.mutex === mutex.id) {
            gates.push({
              x: tileCenterX(tileIndex) + TILE_SIZE / 2,
              y: laneCenterY(laneIndex),
            });
          }
        });
      });
      const title =
        level.resources.find((r) => r.id === mutex.id)?.label ?? mutex.id;
      const panelY = DOOR_PANEL.topY + doorIndex * DOOR_PANEL.gapY;
      return new DoorView(this, mutex, title, gates, panelY, nameOf);
    });
  }

  /**
   * Menggerakkan robot sesuai event. Pada kecepatan tinggi satu notifikasi
   * bisa memuat beberapa tick; yang dipakai adalah instruksi terakhir tiap
   * robot, jadi ubin di tengah dilewati (tween pada satu objek tidak boleh
   * saling menimpa).
   */
  private playEvents(events: readonly SimEvent[], durationMs: number): void {
    const lastIndex = new Map<ThreadId, number>();
    for (const event of events) {
      if (event.type === 'INSTRUCTION')
        lastIndex.set(event.thread, event.index);
    }
    for (const robot of this.robots) {
      const index = lastIndex.get(robot.threadId);
      if (index !== undefined) robot.moveToTile(index, durationMs);
    }
  }

  /** Memperbarui warna, label, nilai papan, dan status pintu tanpa membangun ulang. */
  private refresh(snapshot: Readonly<Snapshot>): void {
    const nameOf = this.nameOf(snapshot);
    this.board?.update(snapshot.sharedVars);
    snapshot.threads.forEach((thread, index) =>
      this.robots[index]?.update(thread),
    );
    for (const door of this.doors) {
      const mutex = snapshot.mutexes.find((m) => m.id === door.mutexId);
      if (mutex !== undefined) door.update(mutex, nameOf);
    }
  }

  /** Id thread -> nama tampilan; id yang tidak dikenal ditampilkan apa adanya. */
  private nameOf(snapshot: Readonly<Snapshot>): NameOf {
    const names = new Map(
      snapshot.threads.map((thread) => [thread.id, thread.label]),
    );
    return (id) => names.get(id) ?? id;
  }

  private destroyViews(): void {
    this.notice?.destroy();
    this.notice = null;
    for (const robot of this.robots) robot.destroy();
    this.robots = [];
    for (const door of this.doors) door.destroy();
    this.doors = [];
    this.board?.destroy();
    this.board = null;
  }

  private showNotice(message: string): void {
    this.notice?.destroy();
    this.notice = this.add
      .text(ARENA.width / 2, ARENA.height / 2, message, TEXT_STYLE)
      .setOrigin(0.5);
  }
}
