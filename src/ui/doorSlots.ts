import type { PlacedTool } from '../engine/tools';
import { mutexToolId } from './toolSpans';

/**
 * Logika murni pemasangan pintu mutex lewat SLOT (PRD bagian 7 dan 17.4).
 * Program n instruksi punya n+1 slot (0..n); slot k = celah sebelum instruksi k.
 * Pintu masuk di slot `entry`, pintu keluar di slot `exit` (exit > entry).
 * Konversi ke data alat: start = entry, end = exit - 1.
 */

export interface Door {
  entry: number;
  exit: number;
}

export function slotCount(programLength: number): number {
  return programLength + 1;
}

/** Slot yang sah untuk pintu keluar setelah pintu masuk dipasang. */
export function validExitSlots(entry: number, programLength: number): number[] {
  const slots: number[] = [];
  for (let slot = entry + 1; slot <= programLength; slot += 1) slots.push(slot);
  return slots;
}

export function spanFromSlots(door: Door): { start: number; end: number } {
  if (door.entry < 0 || door.exit <= door.entry) {
    throw new Error('Pintu keluar harus berada setelah pintu masuk.');
  }
  return { start: door.entry, end: door.exit - 1 };
}

/** Penjelasan awam sebuah slot, dipakai untuk aria-label dan tooltip. */
export function describeSlot(index: number, ops: readonly string[]): string {
  const last = ops.length;
  if (index === 0) return `sebelum ${ops[0]}`;
  if (index === last) return `sesudah ${ops[last - 1]}`;
  return `antara ${ops[index - 1]} dan ${ops[index]}`;
}

/**
 * Membangun satu alat mutex yang berlaku untuk SEMUA robot di loop bersama.
 * `door` null = tidak ada pintu (mengembalikan null supaya alat dilepas).
 */
export function buildSharedMutexTool(
  mutexId: string,
  threadIds: readonly string[],
  door: Door | null,
): PlacedTool | null {
  if (door === null) return null;
  const { start, end } = spanFromSlots(door);
  return {
    id: mutexToolId(mutexId),
    kind: 'mutex',
    mutex: mutexId,
    spans: threadIds.map((thread) => ({ thread, start, end })),
  };
}

/** Membaca pintu dari alat terpasang (semua robot dianggap sama). */
export function readSharedDoor(
  tool: PlacedTool | null | undefined,
): Door | null {
  const span = tool?.spans[0];
  if (span === undefined) return null;
  return { entry: span.start, exit: span.end + 1 };
}

/** Mode klik slot: pilih pintu masuk dulu, lalu pintu keluar. */
export type ClickState = { phase: 'idle' } | { phase: 'entry'; entry: number };

export interface ClickResult {
  state: ClickState;
  door: Door | null;
}

export function clickSlot(
  state: ClickState,
  slot: number,
  total: number,
): ClickResult {
  if (slot < 0 || slot >= total) return { state, door: null };
  if (state.phase === 'idle') {
    // Slot terakhir tidak bisa jadi pintu masuk (tak ada slot keluar sesudahnya).
    if (slot >= total - 1) return { state, door: null };
    return { state: { phase: 'entry', entry: slot }, door: null };
  }
  if (slot > state.entry) {
    return {
      state: { phase: 'idle' },
      door: { entry: state.entry, exit: slot },
    };
  }
  // Klik slot yang sama atau sebelum pintu masuk: pindahkan pintu masuk.
  return { state: { phase: 'entry', entry: slot }, door: null };
}
