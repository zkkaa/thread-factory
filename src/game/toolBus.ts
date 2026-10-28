import type { PlacementDoor, PlacementState } from './doorPlacement';

/** Koordinat pointer dalam piksel viewport (clientX/clientY). */
export interface ClientPoint {
  clientX: number;
  clientY: number;
}

/** Daftar event seret-lepas antara React (toolbox) dan Phaser (scene). */
export interface ToolBusEvents {
  dragStart: { kind: 'mutex' };
  dragMove: ClientPoint;
  drop: ClientPoint;
  dragEnd: null;
  cancel: null;
  /** Dari scene ke React: pintu masuk dan keluar sudah lengkap. */
  doorPlaced: PlacementDoor;
  /** Dari scene ke React: fase pemasangan berubah (untuk label toolbox). */
  phase: PlacementState;
}

type Handler<T> = (payload: T) => void;

/**
 * Pemancar event kecil bertipe. Sengaja tidak memakai EventBus Phaser supaya
 * kode UI yang mengimpornya tetap bisa dites di Node (Phaser butuh DOM).
 */
export class ToolBus {
  private readonly handlers = new Map<
    keyof ToolBusEvents,
    Set<Handler<unknown>>
  >();

  /** Berlangganan; mengembalikan fungsi untuk berhenti. */
  on<K extends keyof ToolBusEvents>(
    event: K,
    handler: Handler<ToolBusEvents[K]>,
  ): () => void {
    const set = this.handlers.get(event) ?? new Set<Handler<unknown>>();
    const stored = handler as Handler<unknown>;
    set.add(stored);
    this.handlers.set(event, set);
    return () => {
      set.delete(stored);
    };
  }

  emit<K extends keyof ToolBusEvents>(
    event: K,
    payload: ToolBusEvents[K],
  ): void {
    // Salinan: pelanggan boleh berhenti berlangganan saat event diproses.
    for (const handler of [...(this.handlers.get(event) ?? [])]) {
      handler(payload);
    }
  }
}

export const toolBus = new ToolBus();
