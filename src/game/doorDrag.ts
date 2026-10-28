import {
  IDLE_PLACEMENT,
  reducePlacement,
  validSlots,
  type PlacementAction,
  type PlacementState,
} from './doorPlacement';
import type { Point } from './layouts/types';
import { nearestSlot } from './slots';
import { SLOT_STYLE } from './theme';
import type { ClientPoint, ToolBus } from './toolBus';
import type { SlotMarkerState } from './views/SlotMarkerView';

export interface DoorDragDeps {
  bus: ToolBus;
  /** Titik layar tiap slot (koordinat game). */
  positions: readonly Point[];
  /** Mengubah koordinat viewport menjadi koordinat game. */
  toGame: (point: ClientPoint) => Point;
  setMarkers: (state: SlotMarkerState) => void;
}

const entryOf = (state: PlacementState): number | null =>
  state.phase === 'holdingExit' ? state.entry : null;

/**
 * Menghubungkan event seret dari toolbox ke state machine pemasangan pintu
 * dan penanda slot. Tidak mengenal Phaser maupun React, jadi bisa dites di
 * Node. Satu sesi dibuat per pembangunan arena dan dibuang saat arena dibuang.
 */
export class DoorDragSession {
  private state: PlacementState = IDLE_PLACEMENT;
  private hover: number | null = null;
  private readonly unsubscribe: (() => void)[];

  constructor(private readonly deps: DoorDragDeps) {
    const { bus } = deps;
    this.unsubscribe = [
      bus.on('dragStart', () => this.dispatch({ type: 'grab' })),
      bus.on('dragMove', (point) => this.move(point)),
      bus.on('drop', (point) => this.drop(point)),
      bus.on('dragEnd', () => this.dispatch({ type: 'release' })),
      bus.on('cancel', () => this.dispatch({ type: 'cancel' })),
    ];
    this.refresh();
  }

  dispose(): void {
    for (const off of this.unsubscribe) off();
    this.unsubscribe.length = 0;
    // Arena dibangun ulang saat pintu dipegang (mis. Reset): beri tahu toolbox.
    if (this.state.phase !== 'idle') {
      this.state = IDLE_PLACEMENT;
      this.deps.bus.emit('phase', IDLE_PLACEMENT);
    }
  }

  private get total(): number {
    return this.deps.positions.length;
  }

  private valid(): Set<number> {
    return new Set(validSlots(this.state, this.total));
  }

  private slotAt(point: ClientPoint): number | null {
    return nearestSlot(
      this.deps.toGame(point),
      this.deps.positions,
      SLOT_STYLE.hitRadius,
      this.valid(),
    );
  }

  private move(point: ClientPoint): void {
    if (this.state.phase === 'idle') return;
    const slot = this.slotAt(point);
    if (slot === this.hover) return;
    this.hover = slot;
    this.refresh();
  }

  private drop(point: ClientPoint): void {
    if (this.state.phase === 'idle') return;
    this.dispatch({ type: 'drop', slot: this.slotAt(point) });
  }

  private dispatch(action: PlacementAction): void {
    const result = reducePlacement(this.state, action, this.total);
    const changed =
      result.state.phase !== this.state.phase ||
      entryOf(result.state) !== entryOf(this.state);
    this.state = result.state;
    this.hover = null;
    this.refresh();
    if (changed) this.deps.bus.emit('phase', this.state);
    if (result.door !== null) this.deps.bus.emit('doorPlaced', result.door);
  }

  private refresh(): void {
    this.deps.setMarkers({
      valid: this.state.phase === 'idle' ? null : this.valid(),
      hover: this.hover,
    });
  }
}
