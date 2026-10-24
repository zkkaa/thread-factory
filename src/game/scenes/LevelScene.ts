import { GameObjects, Scene } from 'phaser';
import type { Snapshot } from '../../engine/types';
import { ARENA, COLORS, LAYOUT, STATE_STYLE, TEXT_STYLE, TILE_SIZE } from '../theme';

/** Data yang harus diberikan saat scene dimulai: scene.start('LevelScene', data). */
export interface LevelSceneData {
    snapshot: Readonly<Snapshot>;
}

/**
 * Scene arena satu level. Tugasnya hanya MENGGAMBAR keadaan yang diberikan;
 * benar/salah, menang/kalah, dan metrik dihitung engine (aturan arsitektur 3).
 *
 * T-026: membangun tampilan awal dari snapshot (kotak per robot + label state
 * + isi Papan Stok). Kotak sementara ini akan digantikan RobotView dan
 * BoardView di T-027 tanpa mengubah cara scene ini menerima data.
 */
export class LevelScene extends Scene {
    private snapshot: Readonly<Snapshot> | null = null;
    private views: GameObjects.GameObject[] = [];

    constructor() {
        super('LevelScene');
    }

    init(data: LevelSceneData): void {
        this.snapshot = data.snapshot;
    }

    create(): void {
        this.cameras.main.setBackgroundColor(COLORS.background);
        if (this.snapshot === null) {
            this.add
                .text(ARENA.width / 2, ARENA.height / 2, 'Level belum dimuat', TEXT_STYLE)
                .setOrigin(0.5);
            return;
        }
        this.rebuild(this.snapshot);
    }

    /**
     * Buang semua tampilan lama lalu bangun ulang dari snapshot.
     * Dipakai saat Reset (T-030): scene tidak menyimpan keadaan sendiri.
     */
    rebuild(snapshot: Readonly<Snapshot>): void {
        this.snapshot = snapshot;
        for (const view of this.views) view.destroy();
        this.views = [];

        this.views.push(this.buildBoardText(snapshot));
        snapshot.threads.forEach((thread, index) => {
            this.buildThreadView(thread.label, thread.state, index);
        });
    }

    /** Teks Papan Stok: semua shared variable beserta nilainya. */
    private buildBoardText(snapshot: Readonly<Snapshot>): GameObjects.Text {
        const values = Object.entries(snapshot.sharedVars)
            .map(([name, value]) => `${name}: ${value}`)
            .join('     ');
        return this.add
            .text(ARENA.width / 2, 80, `Papan Stok     ${values}`, {
                ...TEXT_STYLE,
                fontSize: '24px',
            })
            .setOrigin(0.5);
    }

    /** Satu robot = kotak berwarna + label nama dan state di bawahnya. */
    private buildThreadView(label: string, state: keyof typeof STATE_STYLE, index: number): void {
        const { columns, cellSize, topY } = LAYOUT;
        const column = index % columns;
        const row = Math.floor(index / columns);
        const startX = (ARENA.width - columns * cellSize) / 2 + cellSize / 2;
        const x = startX + column * cellSize;
        const y = topY + row * cellSize;
        const style = STATE_STYLE[state];

        const box = this.add
            .rectangle(x, y, TILE_SIZE, TILE_SIZE, style.color)
            .setStrokeStyle(2, COLORS.tileBorder);
        const caption = this.add
            .text(x, y + TILE_SIZE / 2 + 8, `${label}\n${style.label}`, TEXT_STYLE)
            .setOrigin(0.5, 0);
        this.views.push(box, caption);
    }
}