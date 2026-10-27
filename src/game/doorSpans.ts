import type { InstructionOrigin } from '../engine/tools';
import type { ThreadDef, ThreadId } from '../engine/types';

/** Satu pintu: posisi pintu masuk dan pintu keluar sebagai fraksi jalan. */
export interface DoorSpan {
  entry: number;
  exit: number;
}

function addSlot(map: Map<string, Set<number>>, mutex: string, slot: number) {
  const set = map.get(mutex) ?? new Set<number>();
  set.add(slot);
  map.set(mutex, set);
}

const ascending = (a: number, b: number): number => a - b;

/**
 * Mengumpulkan pasangan pintu masuk (LOCK sisipan) dan pintu keluar
 * (UNLOCK sisipan) tiap mutex. Robot di loop bersama memakai pintu yang
 * sama, jadi slot yang sama digabung. Pasangan dibentuk berdasarkan urutan
 * slot (masuk ke-i dengan keluar ke-i). Fungsi murni agar bisa dites.
 */
export function buildDoorSpans(
  threads: readonly ThreadDef[],
  origins: Readonly<Record<ThreadId, readonly InstructionOrigin[]>>,
  slots: readonly number[],
): Map<string, DoorSpan[]> {
  const entries = new Map<string, Set<number>>();
  const exits = new Map<string, Set<number>>();

  for (const thread of threads) {
    const origin = origins[thread.id] ?? [];
    thread.program.forEach((instruction, index) => {
      const from = origin[index];
      if (from === undefined || from.kind !== 'inserted') return;
      if (instruction.op === 'LOCK') {
        addSlot(entries, instruction.mutex, from.slot);
      } else if (instruction.op === 'UNLOCK') {
        addSlot(exits, instruction.mutex, from.slot);
      }
    });
  }

  const result = new Map<string, DoorSpan[]>();
  for (const [mutex, entrySlots] of entries) {
    const exitSlots = [...(exits.get(mutex) ?? [])].sort(ascending);
    const spans: DoorSpan[] = [];
    [...entrySlots].sort(ascending).forEach((slot, i) => {
      const exitSlot = exitSlots[i];
      const entry = slots[slot];
      const exit = exitSlot === undefined ? undefined : slots[exitSlot];
      if (entry !== undefined && exit !== undefined) {
        spans.push({ entry, exit });
      }
    });
    result.set(mutex, spans);
  }
  return result;
}