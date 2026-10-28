import { GameObjects, Scene, Scenes } from 'phaser';
import {
  TICK_INTERVAL_MS,
  type ControllerState,
  type SimulationController,
} from '../../controller/SimulationController';
import { effectivePrograms } from '../../controller/effectivePrograms';
import type { SimEvent, Snapshot, ThreadId } from '../../engine/types';
import { computeAnchors } from '../anchors';
import { DoorDragSession } from '../doorDrag';
import { buildDoorSpans } from '../doorSpans';
import { getLayout } from '../layouts';
import { pointAt, sampleClosedPath } from '../pathMath';
import { ARENA, COLORS, DOOR_PANEL, TEXT_STYLE } from '../theme';
import { BoardView, type BoardLinkPoint } from '../views/BoardView';
import { CheckpointView } from '../views/CheckpointView';
import { DoorView, type NameOf } from '../views/DoorView';
import { RobotView } from '../views/RobotView';
import { clientToGame, slotPositions } from '../slots';
import { toolBus } from '../toolBus';
import { SlotMarkerView } from '../views/SlotMarkerView';
import { TrackView } from '../views/TrackView';
import { FloorView } from '../views/FloorView';

/** Data yang harus diberikan saat scene dimulai: scene.start('LevelScene', data). */
export interface LevelSceneData {
  controller: SimulationController;
}

/**
 * Scene arena satu level. Tugasnya hanya MENGGAMBAR dan MENGANIMASIKAN apa yang
 * dilaporkan controller; benar/salah, menang/kalah, dan metrik dihitung engine
 * (aturan arsitektur 3). Tata letak (jalan, checkpoint, slot, papan) dibaca
 * dari game/layouts/, bukan di-hardcode di sini.
 *
 * Pada tick 0 (level dimuat, Reset, atau alat berubah) semua view dibangun
 * ulang. Pada tick berikutnya, event INSTRUCTION menggerakkan robot ke jangkar
 * instruksinya dan snapshot memperbarui label, papan, dan pintu.
 */
export class LevelScene extends Scene {
  private controller: SimulationController | null = null;
  private track: TrackView | null = null;
  private checkpoints: CheckpointView[] = [];
  private robots: RobotView[] = [];
  private doors: DoorView[] = [];
  private board: BoardView | null = null;
  private slotMarkers: SlotMarkerView | null = null;
  private doorDrag: DoorDragSession | null = null;
  private notice: GameObjects.Text | null = null;

  constructor() {
    super('LevelScene');
  }

  init(data: LevelSceneData): void {
    this.controller = data.controller;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    const floor = new FloorView(this);
    this.events.once(Scenes.Events.DESTROY, () => floor.destroy());
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
    // game.destroy() memicu DESTROY, bukan SHUTDOWN.
    this.events.once(Scenes.Events.DESTROY, () => {
      unsubscribe();
      this.doorDrag?.dispose();
    });
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

  /** Buang semua view lama lalu bangun ulang dari layout dan keadaan controller. */
  private rebuild(state: ControllerState): void {
    const { level, snapshot } = state;
    if (level === null || snapshot === null) return;

    this.destroyViews();
    const layout = getLayout(level.layoutId);
    if (layout === undefined || layout.kind !== 'loop') {
      this.showNotice(`Layout "${level.layoutId}" belum tersedia`);
      return;
    }

    const { threads: effective, origins } = effectivePrograms(
      level,
      state.tools,
    );
    const path = sampleClosedPath(layout.path);
    const nameOf = this.nameOf(snapshot);

    this.track = new TrackView(this, path);

    const links: BoardLinkPoint[] = [];
    for (const link of layout.boardLinks) {
      const fraction = layout.checkpoints[link.checkpoint];
      if (fraction === undefined) continue;
      const p = pointAt(path, fraction, 0);
      links.push({ x: p.x, y: p.y, direction: link.direction });
    }
    this.board = new BoardView(this, layout.board, snapshot.sharedVars, links);

    // Checkpoint: satu per instruksi program asli (semua robot berprogram sama).
    const original = level.threads[0]?.program ?? [];
    original.forEach((instruction, index) => {
      const fraction = layout.checkpoints[index];
      if (fraction === undefined) return;
      const p = pointAt(path, fraction, 0);
      this.checkpoints.push(new CheckpointView(this, p.x, p.y, instruction));
    });

    // Pintu: pasangan slot masuk (LOCK) dan keluar (UNLOCK) tiap mutex,
    // dibagi semua robot di loop (satu pintu satu kunci).
    const spansByMutex = buildDoorSpans(effective, origins, layout.slots);
    this.doors = snapshot.mutexes.map((mutex, doorIndex) => {
      const title =
        level.resources.find((r) => r.id === mutex.id)?.label ?? mutex.id;
      const panelY = DOOR_PANEL.topY + doorIndex * DOOR_PANEL.gapY;
      return new DoorView(
        this,
        mutex,
        title,
        path,
        spansByMutex.get(mutex.id) ?? [],
        panelY,
        nameOf,
      );
    });

    const positions = slotPositions(path, layout.slots);
    this.slotMarkers = new SlotMarkerView(this, positions);
    this.doorDrag = new DoorDragSession({
      bus: toolBus,
      positions,
      toGame: (point) =>
        clientToGame(
          point.clientX,
          point.clientY,
          this.game.canvas.getBoundingClientRect(),
          ARENA,
        ),
      setMarkers: (markers) => this.slotMarkers?.setState(markers),
    });

    // Robot paling akhir agar berada di atas jalan, checkpoint, dan gerbang.
    this.robots = snapshot.threads.map((thread, laneIndex) => {
      const anchors = computeAnchors(origins[thread.id] ?? [], layout);
      const totalRounds =
        level.threads.find((def) => def.id === thread.id)?.repeat ?? 1;
      return new RobotView(this, thread, {
        path,
        anchors,
        laneOffset: layout.laneOffsets[laneIndex] ?? 0,
        labelSide: laneIndex === 0 ? -1 : 1,
        totalRounds,
      });
    });
  }

  /**
   * Menggerakkan robot sesuai event. Pada kecepatan tinggi satu notifikasi
   * bisa memuat beberapa tick; yang dipakai adalah instruksi terakhir tiap
   * robot. READ dan WRITE juga mengedipkan tautan papan.
   */
  private playEvents(events: readonly SimEvent[], durationMs: number): void {
    const lastIndex = new Map<ThreadId, number>();
    for (const event of events) {
      if (event.type !== 'INSTRUCTION') continue;
      lastIndex.set(event.thread, event.index);
      if (event.op === 'READ') this.board?.pulse('read', durationMs);
      if (event.op === 'WRITE') this.board?.pulse('write', durationMs);
    }
    for (const robot of this.robots) {
      const index = lastIndex.get(robot.threadId);
      if (index !== undefined) robot.moveToInstruction(index, durationMs);
    }
  }

  /** Memperbarui label, nilai papan, dan status pintu tanpa membangun ulang. */
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
    this.track?.destroy();
    this.track = null;
    for (const checkpoint of this.checkpoints) checkpoint.destroy();
    this.checkpoints = [];
    for (const robot of this.robots) robot.destroy();
    this.robots = [];
    for (const door of this.doors) door.destroy();
    this.doors = [];
    this.board?.destroy();
    this.board = null;
    this.doorDrag?.dispose();
    this.doorDrag = null;
    this.slotMarkers?.destroy();
    this.slotMarkers = null;
  }

  private showNotice(message: string): void {
    this.notice?.destroy();
    this.notice = this.add
      .text(ARENA.width / 2, ARENA.height / 2, message, TEXT_STYLE)
      .setOrigin(0.5);
  }
}
