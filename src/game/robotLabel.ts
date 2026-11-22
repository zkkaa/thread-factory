import type { ThreadSnapshot } from '../engine/types';
import { STATE_STYLE } from './theme';

/** Teks status robot; READY ditambah (zzz) agar tidak hanya warna. */
export function statusLabel(thread: ThreadSnapshot): string {
  return thread.state === 'READY' ? 'READY (zzz)' : STATE_STYLE[thread.state].label;
}

/**
 * Baris label robot. Mode ringkas (arena ramai, Level 1-5): satu baris
 * "Nama · STATUS". Mode lengkap: ditambah putaran, waktu tunggu, dan
 * sumber yang ditunggu atau catatan register.
 */
export function robotLabelLines(
  thread: ThreadSnapshot,
  totalRounds: number,
  compact: boolean,
): string[] {
  const head = `${thread.label} · ${statusLabel(thread)}`;
  if (compact) return [head];

  const round =
    thread.state === 'TERMINATED'
      ? totalRounds
      : Math.min(thread.iteration + 1, totalRounds);
  const lines = [
    head,
    `Produk ${round}/${totalRounds} · tunggu ${thread.waitTicks}`,
  ];
  const notes = Object.entries(thread.registers).map(
    ([name, value]) => `${name} = ${value}`,
  );
  if (thread.waitingOn !== null) lines.push(`menunggu ${thread.waitingOn}`);
  else if (notes.length > 0) lines.push(`catatan: ${notes.join(', ')}`);
  return lines;
}

/** Detail untuk kartu stasiun: semua baris label selain baris nama. */
export function robotDetail(
  thread: ThreadSnapshot,
  totalRounds: number,
): string {
  return robotLabelLines(thread, totalRounds, false).slice(1).join(' · ');
}