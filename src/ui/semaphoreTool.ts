import type { PlacedSemaphoreTool } from '../engine/tools';
import { spanFromSlots, type Door } from './doorSlots';

/**
 * Logika murni alat Kartu Akses (counting semaphore) lewat SLOT, sama seperti
 * pintu mutex di doorSlots.ts. Pintu masuk di slot `entry` menjadi SEM_WAIT,
 * pintu keluar di slot `exit` menjadi SEM_SIGNAL. Satu alat berlaku untuk
 * SEMUA robot, dengan nilai awal 1 sampai 8 yang dipilih pemain.
 */

export const MIN_CARDS = 1;
export const MAX_CARDS = 8;

export function semaphoreToolId(sem: string): string {
  return `semaphore:${sem}`;
}

/** Membatasi jumlah kartu ke bilangan bulat 1..8 (masukan slider atau teks). */
export function clampCards(value: number): number {
  if (!Number.isFinite(value)) return MIN_CARDS;
  return Math.min(MAX_CARDS, Math.max(MIN_CARDS, Math.round(value)));
}

/** `door` null = tidak ada gerbang (mengembalikan null supaya alat dilepas). */
export function buildSharedSemaphoreTool(
  sem: string,
  threadIds: readonly string[],
  door: Door | null,
  value: number,
): PlacedSemaphoreTool | null {
  if (door === null) return null;
  const { start, end } = spanFromSlots(door);
  return {
    id: semaphoreToolId(sem),
    kind: 'semaphore',
    sem,
    value: clampCards(value),
    spans: threadIds.map((thread) => ({ thread, start, end })),
  };
}

/** Membaca gerbang dan jumlah kartu dari alat terpasang (semua robot dianggap sama). */
export function readSharedSemaphore(
  tool: PlacedSemaphoreTool | null | undefined,
): { door: Door; value: number } | null {
  const span = tool?.spans[0];
  if (tool === null || tool === undefined || span === undefined) return null;
  return { door: { entry: span.start, exit: span.end + 1 }, value: tool.value };
}