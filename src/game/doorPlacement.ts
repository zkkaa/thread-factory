/**
 * State machine murni pemasangan pintu mutex dengan seret-lepas
 * (PRD 17.4, ARCHITECTURE 6.5): pintu masuk dahulu, lalu pintu keluar.
 * Program n instruksi punya n+1 slot (0..n); keluar harus sesudah masuk.
 * Mesin ini tidak tahu Phaser maupun React: ia hanya menerima aksi dan
 * mengembalikan state baru, jadi bisa dites tanpa browser.
 */

export type PlacementState =
  | { phase: 'idle' }
  | { phase: 'holdingEntry' }
  | { phase: 'holdingExit'; entry: number };

export type PlacementAction =
  /** Pemain mulai menyeret alat dari toolbox. */
  | { type: 'grab' }
  /** Alat dilepas; `slot` null bila tidak dekat slot mana pun. */
  | { type: 'drop'; slot: number | null }
  /** Seretan berakhir (dragend), apa pun hasilnya. */
  | { type: 'release' }
  /** Esc: batalkan semuanya. */
  | { type: 'cancel' };

export interface PlacementDoor {
  entry: number;
  exit: number;
}

export interface PlacementResult {
  state: PlacementState;
  /** Terisi hanya saat pintu keluar berhasil dipasang (pintu lengkap). */
  door: PlacementDoor | null;
}

export const IDLE_PLACEMENT: PlacementState = { phase: 'idle' };

function range(from: number, to: number): number[] {
  const result: number[] = [];
  for (let value = from; value <= to; value += 1) result.push(value);
  return result;
}

/** Slot yang boleh menerima alat yang sedang dipegang (untuk disorot). */
export function validSlots(state: PlacementState, total: number): number[] {
  if (state.phase === 'holdingEntry') return range(0, total - 2);
  if (state.phase === 'holdingExit') return range(state.entry + 1, total - 1);
  return [];
}

export function reducePlacement(
  state: PlacementState,
  action: PlacementAction,
  total: number,
): PlacementResult {
  switch (action.type) {
    case 'grab':
      return {
        state: state.phase === 'idle' ? { phase: 'holdingEntry' } : state,
        door: null,
      };
    case 'drop': {
      if (state.phase === 'idle' || action.slot === null) {
        return { state, door: null };
      }
      if (!validSlots(state, total).includes(action.slot)) {
        return { state, door: null };
      }
      if (state.phase === 'holdingEntry') {
        return {
          state: { phase: 'holdingExit', entry: action.slot },
          door: null,
        };
      }
      return {
        state: IDLE_PLACEMENT,
        door: { entry: state.entry, exit: action.slot },
      };
    }
    case 'release':
      // Pintu masuk yang belum terpasang batal; pintu masuk yang sudah
      // terpasang tetap menunggu pintu keluar.
      return {
        state: state.phase === 'holdingEntry' ? IDLE_PLACEMENT : state,
        door: null,
      };
    case 'cancel':
      return { state: IDLE_PLACEMENT, door: null };
  }
}
