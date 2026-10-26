import type { ControllerState } from '../controller/SimulationController';
import type { SimEvent, ThreadState } from '../engine/types';

/**
 * Log kejadian untuk StepLog. Murni TypeScript (tanpa React) supaya bisa dites.
 * Tugasnya hanya MENERJEMAHKAN event engine menjadi kalimat dan menyimpan
 * riwayatnya; tidak ada aturan permainan di sini.
 */

export type LogKind =
  | 'state'
  | 'instruction'
  | 'write'
  | 'lock'
  | 'unlock'
  | 'blocked'
  | 'deadlock'
  | 'finished';

export interface LogEntry {
  /** Nomor urut unik (untuk key React). */
  readonly id: number;
  readonly tick: number;
  readonly kind: LogKind;
  readonly text: string;
  /**
   * Perpindahan rutin yang dibuat scheduler (NEW/READY/RUNNING). Disembunyikan
   * secara default karena hampir tiap tick terjadi dan menenggelamkan kejadian lain.
   */
  readonly minor: boolean;
}

export type NameOf = (id: string) => string;

const SCHEDULER_STATES: readonly ThreadState[] = ['NEW', 'READY', 'RUNNING'];

function assertNever(value: never): never {
  throw new Error(`Event tidak dikenal: ${JSON.stringify(value)}`);
}

/** Menerjemahkan satu event menjadi baris log. `nameOf` mengubah id thread menjadi namanya. */
export function describeEvent(
  event: SimEvent,
  nameOf: NameOf,
): Omit<LogEntry, 'id'> {
  const { tick } = event;
  switch (event.type) {
    case 'THREAD_STATE':
      return {
        tick,
        kind: 'state',
        text: `${nameOf(event.thread)}: ${event.from} → ${event.to}`,
        minor:
          SCHEDULER_STATES.includes(event.from) &&
          SCHEDULER_STATES.includes(event.to),
      };
    case 'INSTRUCTION':
      return {
        tick,
        kind: 'instruction',
        text: `${nameOf(event.thread)} menjalankan ${event.op}`,
        minor: false,
      };
    case 'VAR_WRITTEN':
      return {
        tick,
        kind: 'write',
        text: `${nameOf(event.thread)} menulis ${event.name}: ${event.oldValue} → ${event.newValue}`,
        minor: false,
      };
    case 'LOCK_ACQUIRED':
      return {
        tick,
        kind: 'lock',
        text: `${nameOf(event.thread)} memegang kunci pintu "${event.mutex}"`,
        minor: false,
      };
    case 'LOCK_RELEASED':
      return {
        tick,
        kind: 'unlock',
        text: `${nameOf(event.thread)} melepas kunci pintu "${event.mutex}"`,
        minor: false,
      };
    case 'BLOCKED':
      return {
        tick,
        kind: 'blocked',
        text: `${nameOf(event.thread)} menunggu (${event.on})`,
        minor: false,
      };
    case 'DEADLOCK_DETECTED':
      return {
        tick,
        kind: 'deadlock',
        text: `Deadlock terdeteksi: ${event.cycle.map(nameOf).join(' → ')}`,
        minor: false,
      };
    case 'FINISHED':
      return { tick, kind: 'finished', text: 'Simulasi selesai', minor: false };
    default:
      return assertNever(event);
  }
}

/**
 * Menyimpan riwayat kejadian dari notifikasi controller.
 *
 * - Riwayat dikosongkan saat controller kembali ke tick 0 (Reset, level dimuat,
 *   atau alat berubah).
 * - Controller memakai ulang array `events` yang sama pada notifikasi yang bukan
 *   dari tick baru (mis. setSpeed). Array yang sama diabaikan supaya tidak tercatat dua kali.
 * - Hanya `limit` entri terbaru yang disimpan.
 */
export class EventLog {
  private entries: readonly LogEntry[] = [];
  private lastEvents: readonly SimEvent[] | null = null;
  private nextId = 1;
  private readonly listeners = new Set<() => void>();

  constructor(private readonly limit = 300) {}

  /** Daftar entri (kronologis). Objek yang sama dikembalikan selama tidak ada perubahan. */
  getEntries(): readonly LogEntry[] {
    return this.entries;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  push(state: ControllerState): void {
    const { snapshot, events } = state;

    if (snapshot !== null && snapshot.tick === 0) {
      this.lastEvents = events;
      if (this.entries.length > 0) {
        this.entries = [];
        this.notify();
      }
      return;
    }

    if (events === this.lastEvents) return;
    this.lastEvents = events;
    if (snapshot === null || events.length === 0) return;

    const labels = new Map(
      snapshot.threads.map((thread) => [thread.id, thread.label]),
    );
    const nameOf: NameOf = (id) => labels.get(id) ?? id;

    const added = events.map((event) => ({
      id: this.nextId++,
      ...describeEvent(event, nameOf),
    }));
    this.entries = [...this.entries, ...added].slice(-this.limit);
    this.notify();
  }

  private notify(): void {
    for (const listener of [...this.listeners]) listener();
  }
}
