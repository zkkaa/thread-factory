import { Engine } from '../engine/engine';
import type { PlacedTool } from '../engine/tools';
import type { SimEvent, SimulationEngine, Snapshot } from '../engine/types';
import type { LevelDefinition } from '../levels/types';
import { buildEngineConfig } from './buildEngineConfig';
import { browserClock, type Clock } from './clock';

export type RunState = 'idle' | 'running' | 'paused' | 'finished';
export type Speed = 0.5 | 1 | 5;

/** Laju dasar simulasi pada kecepatan 1x. */
export const TICKS_PER_SECOND = 4;
/** Selang satu tick pada 1x. Phaser memakai `TICK_INTERVAL_MS / speed` sebagai durasi tween. */
export const TICK_INTERVAL_MS = 1000 / TICKS_PER_SECOND;

const DEFAULT_SEED = 1;
// Bila tab disembunyikan lalu dibuka lagi, selisih waktu antar frame bisa sangat besar.
// Dibatasi agar simulasi tidak "ngebut" mengejar ketinggalan.
const MAX_FRAME_MS = 250;
const MAX_TICKS_PER_FRAME = 10;

/**
 * Keadaan yang dilihat UI dan Phaser. Objek baru dibuat setiap ada perubahan,
 * dan objek yang sama dikembalikan selama tidak ada perubahan (syarat useSyncExternalStore).
 */
export interface ControllerState {
  readonly level: LevelDefinition | null;
  readonly runState: RunState;
  readonly snapshot: Readonly<Snapshot> | null;
  /** Semua event sejak notifikasi sebelumnya (bisa lebih dari satu tick pada kecepatan tinggi). */
  readonly events: readonly SimEvent[];
  readonly speed: Speed;
  readonly seed: number;
  /** Alat yang sedang dipasang pemain (salinan; untuk digambar UI dan Phaser). */
  readonly tools: readonly PlacedTool[];
  /** Pesan error dari engine (mis. UNLOCK oleh non-pemilik); null bila tidak ada. */
  readonly error: string | null;
}

export type ControllerListener = (state: ControllerState) => void;

const INITIAL_STATE: ControllerState = {
  level: null,
  runState: 'idle',
  snapshot: null,
  events: [],
  speed: 1,
  seed: DEFAULT_SEED,
  tools: [],
  error: null,
};

/** Salinan alat agar perubahan oleh pemanggil setelah placeTool tidak ikut mengubah state. */
function copyTool(tool: PlacedTool): PlacedTool {
  return { ...tool, spans: tool.spans.map((span) => ({ ...span })) };
}

/**
 * Satu-satunya pemilik jam simulasi dan satu-satunya pemanggil engine.step().
 * Analogi: akumulator waktu seperti celengan. Tiap frame kita menabung waktu
 * yang berlalu; setiap kali isinya cukup untuk satu tick, kita "belanjakan"
 * dengan memanggil engine.step().
 */
export class SimulationController {
  private state: ControllerState = INITIAL_STATE;
  // Alat pemain, dipakai membangun EngineConfig. Diubah hanya lewat placeTool/removeTool
  // (dan dikosongkan loadLevel); salinannya selalu dicerminkan ke state.tools.
  private placedTools: PlacedTool[] = [];
  private readonly listeners = new Set<ControllerListener>();
  private frameHandle: number | null = null;
  private lastFrameTime: number | null = null;
  private accumulator = 0;

  constructor(
    private readonly engine: SimulationEngine = new Engine(),
    private readonly clock: Clock = browserClock,
  ) {}

  getState(): ControllerState {
    return this.state;
  }

  subscribe(listener: ControllerListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Memuat level dari awal (alat pemain dikosongkan). Seed default: tutorialSeed level. */
  loadLevel(level: LevelDefinition, seed?: number): void {
    const nextSeed = seed ?? level.tutorialSeed ?? DEFAULT_SEED;
    // load() dipanggil dulu: bila gagal (mis. seed tidak valid), state lama tetap utuh.
    this.engine.load(buildEngineConfig(level, []), nextSeed);
    this.stopClock();
    this.placedTools = [];
    this.setState({
      level,
      runState: 'idle',
      snapshot: this.engine.getSnapshot(),
      events: [],
      seed: nextSeed,
      tools: [],
      error: null,
    });
  }

  /**
   * Memasang alat. Hanya boleh saat idle (sebelum Run); setelah itu pemain
   * harus Reset dulu. Melempar Error bila terkunci, alat tidak tersedia di
   * level, id sudah dipakai, atau konfigurasinya tidak valid.
   */
  placeTool(tool: PlacedTool): void {
    const level = this.requireEditableLevel();
    if (!level.availableTools.includes(tool.kind)) {
      throw new Error(`Alat "${tool.kind}" tidak tersedia di level ${level.id}.`);
    }
    if (this.placedTools.some((placed) => placed.id === tool.id)) {
      throw new Error(`Alat dengan id "${tool.id}" sudah terpasang.`);
    }
    this.commitTools(level, [...this.placedTools, copyTool(tool)]);
  }

  /** Melepas alat berdasarkan id. Aturan penguncian sama dengan placeTool. */
  removeTool(id: string): void {
    const level = this.requireEditableLevel();
    if (!this.placedTools.some((placed) => placed.id === id)) {
      throw new Error(`Alat dengan id "${id}" tidak ditemukan.`);
    }
    this.commitTools(
      level,
      this.placedTools.filter((placed) => placed.id !== id),
    );
  }

  run(): void {
    if (!this.canStart()) return;
    // Jam dinyalakan sebelum setState agar pause() dari listener tetap efektif.
    this.startClock();
    this.setState({ runState: 'running', events: [], error: null });
  }

  pause(): void {
    if (this.state.runState !== 'running') return;
    this.stopClock();
    this.setState({ runState: 'paused', events: [] });
  }

  /** Maju tepat satu tick. Hanya berlaku saat idle atau paused. */
  step(): void {
    if (!this.canStart()) return;
    this.advance(1);
  }

  /**
   * Kembali ke awal. Engine dimuat ulang (bukan engine.reset) karena
   * konfigurasinya harus dibangun lagi dari level + alat pemain terbaru.
   * Alat pemain tetap terpasang, tetapi kunci alat terbuka lagi (state idle).
   */
  reset(seed?: number): void {
    const { level } = this.state;
    if (level === null) return;
    const nextSeed = seed ?? this.state.seed;
    this.engine.load(buildEngineConfig(level, this.placedTools), nextSeed);
    this.stopClock();
    this.setState({
      runState: 'idle',
      snapshot: this.engine.getSnapshot(),
      events: [],
      seed: nextSeed,
      error: null,
    });
  }

  setSpeed(speed: Speed): void {
    if (speed === this.state.speed) return;
    this.setState({ speed });
  }

  /** Hentikan jam dan lepas semua listener (dipanggil saat komponen/scene dibongkar). */
  dispose(): void {
    this.stopClock();
    this.listeners.clear();
  }

  private canStart(): boolean {
    const { level, runState } = this.state;
    return level !== null && (runState === 'idle' || runState === 'paused');
  }

  /**
   * Alat hanya boleh diubah saat idle. Pada paused/finished simulasi sudah
   * pernah berjalan, jadi mengubah alat akan membuat hasil di layar tidak
   * sesuai dengan konfigurasinya. Aturan ini dijaga di sini, bukan hanya di UI.
   */
  private requireEditableLevel(): LevelDefinition {
    const { level, runState } = this.state;
    if (level === null) throw new Error('Belum ada level yang dimuat.');
    if (runState !== 'idle') {
      throw new Error('Alat terkunci karena simulasi sudah dimulai; tekan Reset dulu.');
    }
    return level;
  }

  /**
   * Menerapkan daftar alat baru. Engine dimuat ulang dengan konfigurasi baru
   * SEBELUM daftar alat disimpan: bila alat tidak valid (mis. rentang di luar
   * program), load() melempar error dan state lama tetap utuh.
   */
  private commitTools(level: LevelDefinition, next: PlacedTool[]): void {
    this.engine.load(buildEngineConfig(level, next), this.state.seed);
    this.placedTools = next;
    this.setState({
      tools: next.map(copyTool),
      snapshot: this.engine.getSnapshot(),
      events: [],
      error: null,
    });
  }

  private setState(patch: Partial<ControllerState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of [...this.listeners]) listener(this.state);
  }

  /** Menjalankan `count` tick, lalu memberi tahu listener satu kali. */
  private advance(count: number): void {
    const events: SimEvent[] = [];
    let finished = false;
    let error: string | null = null;

    try {
      for (let i = 0; i < count && !finished; i++) {
        const result = this.engine.step();
        events.push(...result.events);
        finished = result.finished;
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }

    let runState: RunState = this.state.runState === 'running' ? 'running' : 'paused';
    if (error !== null) runState = 'paused';
    else if (finished) runState = 'finished';
    if (runState !== 'running') this.stopClock();

    this.setState({ runState, snapshot: this.engine.getSnapshot(), events, error });
  }

  private startClock(): void {
    this.stopClock();
    this.scheduleFrame();
  }

  private stopClock(): void {
    if (this.frameHandle !== null) {
      this.clock.cancelFrame(this.frameHandle);
      this.frameHandle = null;
    }
    this.lastFrameTime = null;
    this.accumulator = 0;
  }

  private scheduleFrame(): void {
    if (this.frameHandle !== null) return; // cegah dua loop berjalan bersamaan
    this.frameHandle = this.clock.requestFrame(this.onFrame);
  }

  private readonly onFrame = (time: number): void => {
    this.frameHandle = null;
    if (this.state.runState !== 'running') return;

    // Frame pertama hanya menjadi titik acuan waktu.
    if (this.lastFrameTime !== null) {
      const elapsed = Math.min(Math.max(time - this.lastFrameTime, 0), MAX_FRAME_MS);
      this.accumulator += elapsed * this.state.speed;
    }
    this.lastFrameTime = time;

    let due = Math.floor(this.accumulator / TICK_INTERVAL_MS);
    if (due > MAX_TICKS_PER_FRAME) {
      due = MAX_TICKS_PER_FRAME;
      this.accumulator = 0; // buang sisa daripada terus mengejar
    } else {
      this.accumulator -= due * TICK_INTERVAL_MS;
    }

    if (due > 0) this.advance(due);
    if (this.state.runState === 'running') this.scheduleFrame();
  };
}