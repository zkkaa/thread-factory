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
import { layout1_5Line } from '../layouts/level-1-5.line.layout';
import { pointAt } from '../pathMath';
import { buildRoad } from '../roadGeometry';
import { ARENA, COLORS, DEPTH, DOOR_PANEL, TEXT_STYLE } from '../theme';
import { BoardView, type BoardLinkPoint } from '../views/BoardView';
import { CheckpointView } from '../views/CheckpointView';
import { DoorView, type NameOf } from '../views/DoorView';
import { RobotView } from '../views/RobotView';
import { clientToGame, slotPositions } from '../slots';
import { toolBus } from '../toolBus';
import { SlotMarkerView } from '../views/SlotMarkerView';
import { TrackView } from '../views/TrackView';
import { ARENA_BACKGROUND, robotFrameFor } from '../assetManifest';
import { HallArena } from './HallArena';
import { DeskArena } from './DeskArena';
import { CombinedArena } from './CombinedArena';
import { LineArena } from './LineArena';
import { FlowArena } from './FlowArena';
import { BeltArena } from './BeltArena';
import { TableArena } from './TableArena';
import { BoardArena } from './BoardArena';
import { TripleArena } from './TripleArena';

/** Data yang harus diberikan saat scene dimulai: scene.start('LevelScene', data). */
export interface LevelSceneData {
  controller: SimulationController;
}

/**
 * Pratinjau arena lini lurus Level 1-5: aktif hanya bila URL memuat "line"
 * (mis. http://localhost:5173/?line). Tanpa itu Level 1-5 memakai layout
 * dari data level. Hapus fungsi ini setelah LineArena tidak dipakai lagi.
 */
function wantsLinePreview(levelId: string): boolean {
  return levelId === '1-5' && window.location.search.includes('line');
}

/**
 * Scene arena satu level. Tugasnya hanya MENGGAMBAR dan MENGANIMASIKAN apa yang
 * dilaporkan controller; benar/salah, menang/kalah, dan metrik dihitung engine
 * (aturan arsitektur 3). Tata letak dibaca dari game/layouts/, bukan
 * di-hardcode di sini.
 *
 * Alur: pada tick 0 (level dimuat, Reset, atau alat berubah) semua view dibangun
 * ulang di rebuild(). Pada tick berikutnya handleState() meneruskan snapshot
 * dan event ke arena yang sedang aktif.
 *
 * Jenis layout dan penanganannya:
 * - hall -> HallArena        - desk  -> DeskArena     - belt   -> BeltArena
 * - board -> BoardArena      - table -> TableArena    - triple -> TripleArena
 * - flow (1-5) -> FlowArena  - line (pratinjau) -> LineArena
 * - combined dan loop (1-1, 1-2): digambar di sini (jalan, checkpoint,
 *   slot, papan, robot); combined juga memakai CombinedArena untuk kartu stasiun.
 */
export class LevelScene extends Scene {
  private controller: SimulationController | null = null;
  private track: TrackView | null = null;
  private checkpoints: CheckpointView[] = [];
  private robots: RobotView[] = [];
  private doors: DoorView[] = [];
  private hallArena: HallArena | null = null;
  private deskArena: DeskArena | null = null;
  private combinedArena: CombinedArena | null = null;
  private lineArena: LineArena | null = null;
  private flowArena: FlowArena | null = null;
  private beltArena: BeltArena | null = null;
  private boardArena: BoardArena | null = null;
  private tableArena: TableArena | null = null;
  private tripleArena: TripleArena | null = null;
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
    this.cameras.main.centerOn(ARENA.width / 2, ARENA.height / 2);
    if (this.textures.exists(ARENA_BACKGROUND.key)) {
      this.add
        .image(ARENA.width / 2, ARENA.height / 2, ARENA_BACKGROUND.key)
        .setDisplaySize(ARENA.width, ARENA.height)
        .setDepth(DEPTH.floor);
    } else {
      console.warn(
        `Aset "${ARENA_BACKGROUND.path}" gagal dimuat; memakai latar polos.`,
      );
    }
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

  /** Titik masuk tiap perubahan state controller. */
  private handleState(state: ControllerState): void {
    const { level, snapshot } = state;
    if (level === null || snapshot === null) return;
    if (snapshot.tick === 0) {
      this.rebuild(state);
      return;
    }
    const durationMs = TICK_INTERVAL_MS / state.speed;

    // Arena yang menangani dirinya sendiri: perbarui lalu selesai.
    if (this.hallArena !== null) {
      this.hallArena.update(snapshot, durationMs);
      return;
    }
    if (this.deskArena !== null) {
      this.deskArena.update(snapshot, state.events);
      return;
    }
    if (this.beltArena !== null) {
      this.beltArena.update(snapshot, state.events, durationMs);
      return;
    }
    if (this.boardArena !== null) {
      this.boardArena.update(snapshot);
      return;
    }
    if (this.tableArena !== null) {
      this.tableArena.update(snapshot);
      return;
    }
    if (this.tripleArena !== null) {
      this.tripleArena.update(snapshot, state.events, durationMs);
      return;
    }
    if (this.flowArena !== null) {
      this.flowArena.update(snapshot, state.tools, state.events, durationMs);
      return;
    }
    if (this.lineArena !== null) {
      this.lineArena.update(snapshot, state.tools, state.events, durationMs);
      return;
    }

    // Loop (1-1, 1-2) dan combined: digambar di scene ini.
    this.combinedArena?.update(snapshot, state.tools, state.events);
    this.playEvents(state.events, durationMs);
    this.refresh(snapshot);
  }

  /** Buang semua view lama lalu bangun ulang dari layout dan keadaan controller. */
  private rebuild(state: ControllerState): void {
    const { level, snapshot } = state;
    if (level === null || snapshot === null) return;

    this.destroyViews();
    const layout = wantsLinePreview(level.id)
      ? layout1_5Line
      : getLayout(level.layoutId);
    if (layout === undefined) {
      this.showNotice(`Layout "${level.layoutId}" belum tersedia`);
      return;
    }
    const { threads: effective, origins } = effectivePrograms(
      level,
      state.tools,
    );

    // Jenis layout yang diserahkan penuh ke arena masing-masing.
    if (layout.kind === 'flow') {
      this.flowArena = new FlowArena(
        this,
        layout,
        level,
        snapshot,
        effective,
        state.tools,
      );
      return;
    }
    if (layout.kind === 'hall') {
      this.hallArena = new HallArena(
        this,
        layout,
        level,
        snapshot,
        effective,
        state.tools.some((tool) => tool.kind === 'semaphore'),
      );
      return;
    }
    if (layout.kind === 'desk') {
      this.deskArena = new DeskArena(this, layout, level, snapshot);
      return;
    }
    if (layout.kind === 'belt') {
      this.beltArena = new BeltArena(this, layout, level, snapshot);
      return;
    }
    if (layout.kind === 'board') {
      this.boardArena = new BoardArena(this, layout, level, snapshot);
      return;
    }
    if (layout.kind === 'table') {
      this.tableArena = new TableArena(this, layout, effective, snapshot);
      return;
    }
    if (layout.kind === 'triple') {
      this.tripleArena = new TripleArena(
        this,
        layout,
        level,
        snapshot,
        effective,
      );
      return;
    }
    if (layout.kind === 'line') {
      this.lineArena = new LineArena(
        this,
        layout,
        level,
        snapshot,
        effective,
        origins,
        state.tools,
      );
      return;
    }

    // Sisanya: 'loop' dan 'combined'. Kartu stasiun combined dibuat dulu,
    // lalu jalan dan robot digambar di bawah ini.
    if (layout.kind === 'combined') {
      this.combinedArena = new CombinedArena(
        this,
        layout,
        level,
        snapshot,
        state.tools,
      );
    }
    if (layout.kind === 'laneHall') {
      this.showNotice('Arena aula dua lajur belum tersambung');
      return;
    }
    const road = buildRoad(layout.road);
    const path = road.path;
    const nameOf = this.nameOf(snapshot);

    this.track = new TrackView(this, road);

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
        layout.kind === 'combined' && doorIndex === 0
          ? layout.warehouse.doorPanel
          : undefined,
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
        spriteFrame: robotFrameFor(laneIndex),
        compactLabel: layout.kind === 'combined',
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
    this.hallArena?.destroy();
    this.hallArena = null;
    this.deskArena?.destroy();
    this.deskArena = null;
    this.beltArena?.destroy();
    this.beltArena = null;
    this.boardArena?.destroy();
    this.boardArena = null;
    this.tripleArena?.destroy();
    this.tripleArena = null;
    this.tableArena?.destroy();
    this.tableArena = null;
    this.combinedArena?.destroy();
    this.combinedArena = null;
    this.lineArena?.destroy();
    this.lineArena = null;
    this.flowArena?.destroy();
    this.flowArena = null;
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
