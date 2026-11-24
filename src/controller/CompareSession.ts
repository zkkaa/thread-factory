import type { LevelDefinition } from '../levels/types';
import {
  type CompareSide,
  type CompareSummary,
  compareStates,
} from './compareMetrics';
import {
  SimulationController,
  type LoadOptions,
  type Speed,
} from './SimulationController';

/** Level dan opsi muat untuk satu sisi. */
export interface SideSetup {
  level: LevelDefinition;
  options?: LoadOptions;
}

/**
 * Mode Bandingkan: dua controller dengan seed sama yang dikendalikan bersama.
 * Perintah diteruskan ke keduanya. Karena keduanya meminta frame pada saat yang
 * sama, akumulator waktunya berjalan seragam dan tick keduanya tetap serempak.
 * Tidak ada aturan permainan di sini; penilaian tetap di controller.
 */
export class CompareSession {
  private readonly listeners = new Set<() => void>();
  private readonly unsubscribes: (() => void)[];

  constructor(
    readonly a: SimulationController = new SimulationController(),
    readonly b: SimulationController = new SimulationController(),
  ) {
    this.unsubscribes = [
      a.subscribe(() => this.notify()),
      b.subscribe(() => this.notify()),
    ];
  }

  controllerOf(side: CompareSide): SimulationController {
    return side === 'A' ? this.a : this.b;
  }

  /** Seed yang dipakai kedua sisi (selalu sama). */
  getSeed(): number {
    return this.a.getState().seed;
  }

  /**
   * Memuat kedua sisi dengan seed yang sama; alat pemain dikosongkan. Tanpa
   * `setupB`, B memakai konfigurasi yang sama dengan A. Bintang selalu mati.
   * Bila memuat sisi B gagal, error dilempar ulang (sisi A sudah termuat).
   */
  load(setupA: SideSetup, setupB: SideSetup = setupA, seed?: number): void {
    this.a.loadLevel(setupA.level, seed, { ...setupA.options, rated: false });
    this.b.loadLevel(setupB.level, this.a.getState().seed, {
      ...setupB.options,
      rated: false,
    });
  }

  run(): void {
    this.a.run();
    this.b.run();
  }

  pause(): void {
    this.a.pause();
    this.b.pause();
  }

  step(): void {
    this.a.step();
    this.b.step();
  }

  /** Reset kedua sisi; seed baru (bila ada) berlaku untuk keduanya. */
  reset(seed?: number): void {
    const nextSeed = seed ?? this.getSeed();
    this.a.reset(nextSeed);
    this.b.reset(nextSeed);
  }

  setSpeed(speed: Speed): void {
    this.a.setSpeed(speed);
    this.b.setSpeed(speed);
  }

  getSummary(): CompareSummary | null {
    return compareStates(this.a.getState(), this.b.getState());
  }

  /** Dipanggil setiap salah satu sisi berubah. Mengembalikan fungsi berhenti. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispose(): void {
    for (const off of this.unsubscribes) off();
    this.unsubscribes.length = 0;
    this.listeners.clear();
    this.a.dispose();
    this.b.dispose();
  }

  private notify(): void {
    for (const listener of [...this.listeners]) listener();
  }
}
