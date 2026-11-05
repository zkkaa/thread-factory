import type { PlacementDoor } from './doorPlacement';
import type { Point } from './layouts/types';
import type { ClientPoint, ToolBus } from './toolBus';

/** Sorotan sasaran lepas: mati, siap (kartu sedang diseret), atau tepat di pintu. */
export type GateDropState = 'off' | 'ready' | 'over';

/** Apakah `point` berada dalam jarak `radius` dari pintu. NaN dianggap tidak dekat. */
export function isNearDoor(point: Point, door: Point, radius: number): boolean {
  return Math.hypot(point.x - door.x, point.y - door.y) <= radius;
}

export interface GateDragDeps {
  bus: ToolBus;
  /** Pusat pintu aula (koordinat game). */
  door: Point;
  /** Jarak terjauh dari pintu agar lepasan dianggap mengena (piksel). */
  hitRadius: number;
  /** Rentang gerbang dari layout: indeks instruksi ASLI, inklusif. */
  gate: { start: number; end: number };
  /** Mengubah koordinat viewport menjadi koordinat game. */
  toGame: (point: ClientPoint) => Point;
  setState: (state: GateDropState) => void;
}

/**
 * Menghubungkan seretan Kartu Akses dari toolbox ke pintu aula. Tidak mengenal
 * Phaser maupun React, jadi bisa dites di Node. Hanya menanggapi dragStart
 * berjenis 'semaphore'. Saat dilepas dekat pintu, memancarkan 'gatePlaced'
 * dengan slot masuk = gate.start dan slot keluar = gate.end + 1.
 */
export class GateDragSession {
  private active = false;
  private state: GateDropState = 'off';
  private readonly unsubscribe: (() => void)[];

  constructor(private readonly deps: GateDragDeps) {
    const { bus } = deps;
    this.unsubscribe = [
      bus.on('dragStart', (event) => {
        if (event.kind === 'semaphore') this.begin();
      }),
      bus.on('dragMove', (point) => this.move(point)),
      bus.on('drop', (point) => this.drop(point)),
      bus.on('dragEnd', () => this.end()),
      bus.on('cancel', () => this.end()),
    ];
  }

  /** Berhenti mendengarkan. Sengaja tidak menyentuh view: arena sudah dibuang. */
  dispose(): void {
    for (const off of this.unsubscribe) off();
    this.unsubscribe.length = 0;
  }

  private near(point: ClientPoint): boolean {
    const { door, hitRadius, toGame } = this.deps;
    return isNearDoor(toGame(point), door, hitRadius);
  }

  private begin(): void {
    this.active = true;
    this.set('ready');
  }

  private move(point: ClientPoint): void {
    if (!this.active) return;
    this.set(this.near(point) ? 'over' : 'ready');
  }

  private drop(point: ClientPoint): void {
    if (!this.active) return;
    const hit = this.near(point);
    // Sorotan dimatikan SEBELUM event dipancarkan: pemasangan alat membangun ulang
    // arena, sehingga view ini sudah dibuang begitu emit() selesai.
    this.end();
    if (hit) {
      const { gate, bus } = this.deps;
      bus.emit('gatePlaced', { entry: gate.start, exit: gate.end + 1 });
    }
  }

  private end(): void {
    this.active = false;
    this.set('off');
  }

  private set(state: GateDropState): void {
    if (state === this.state) return;
    this.state = state;
    this.deps.setState(state);
  }
}