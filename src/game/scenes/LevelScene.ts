import { GameObjects, Scene, Scenes } from 'phaser';
import { buildEngineConfig } from '../../controller/buildEngineConfig';
import {
    TICK_INTERVAL_MS,
    type ControllerState,
    type SimulationController,
} from '../../controller/SimulationController';
import type { SimEvent, Snapshot, ThreadId } from '../../engine/types';
import { ARENA, COLORS, TEXT_STYLE } from '../theme';
import { BoardView } from '../views/BoardView';
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
 * snapshot memperbarui warna, label, dan nilai papan.
 */
export class LevelScene extends Scene {
    private controller: SimulationController | null = null;
    private robots: RobotView[] = [];
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
        const unsubscribe = controller.subscribe((state) => this.handleState(state));
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

        this.board = new BoardView(this, snapshot.sharedVars, ARENA.width / 2, 80);
        this.robots = snapshot.threads.map((thread, laneIndex) => {
            const program = programs.find((def) => def.id === thread.id)?.program ?? [];
            return new RobotView(this, thread, program, laneIndex);
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
            if (event.type === 'INSTRUCTION') lastIndex.set(event.thread, event.index);
        }
        for (const robot of this.robots) {
            const index = lastIndex.get(robot.threadId);
            if (index !== undefined) robot.moveToTile(index, durationMs);
        }
    }

    /** Memperbarui warna, label, dan nilai papan tanpa membangun ulang. */
    private refresh(snapshot: Readonly<Snapshot>): void {
        this.board?.update(snapshot.sharedVars);
        snapshot.threads.forEach((thread, index) => this.robots[index]?.update(thread));
    }

    private destroyViews(): void {
        this.notice?.destroy();
        this.notice = null;
        for (const robot of this.robots) robot.destroy();
        this.robots = [];
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