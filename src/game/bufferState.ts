import type { BufferSnapshot, SimEvent } from '../engine/types';
import type { Rect } from './layouts/types';

export interface SlotSpot {
  x: number;
  y: number;
  size: number;
  filled: boolean;
}

export interface SlotOptions {
  padding: number;
  gap: number;
  maxSize: number;
  headerHeight: number;
  footerHeight: number;
}

/**
 * Posisi tiap slot ban dalam satu baris. Barang menumpuk dari ujung kanan
 * (sisi consumer), jadi slot terisi adalah `items` slot paling kanan.
 */
export function layoutSlots(
  rect: Rect,
  buffer: Pick<BufferSnapshot, 'capacity' | 'items'>,
  options: SlotOptions,
): SlotSpot[] {
  const { capacity } = buffer;
  if (capacity < 1) return [];
  const items = Math.max(0, Math.min(buffer.items, capacity));
  const room = rect.width - options.padding * 2 - options.gap * (capacity - 1);
  const size = Math.max(0, Math.min(options.maxSize, room / capacity));
  const rowWidth = size * capacity + options.gap * (capacity - 1);
  const left = rect.x + (rect.width - rowWidth) / 2;
  const bodyHeight = rect.height - options.headerHeight - options.footerHeight;
  const y = rect.y + options.headerHeight + bodyHeight / 2;
  return Array.from({ length: capacity }, (_, index) => ({
    x: left + size / 2 + index * (size + options.gap),
    y,
    size,
    filled: index >= capacity - items,
  }));
}

export interface BufferLabels {
  header: string;
  stats: string;
  hasProblem: boolean;
}

/** Teks header dan statistik ban. Warna selalu disertai teks. */
export function describeBuffer(buffer: BufferSnapshot): BufferLabels {
  const status =
    buffer.items >= buffer.capacity
      ? 'PENUH'
      : buffer.items === 0
        ? 'KOSONG'
        : 'TERISI';
  return {
    header: `Ban Berjalan: ${buffer.items} / ${buffer.capacity} (${status})`,
    stats: `Overflow: ${buffer.overflows} · Underflow: ${buffer.underflows}`,
    hasProblem: buffer.overflows > 0 || buffer.underflows > 0,
  };
}

export interface BufferFlash {
  put: boolean;
  taken: boolean;
  overflow: boolean;
  underflow: boolean;
}

/** Kejadian ban `bufferId` pada satu notifikasi controller. */
export function bufferFlash(
  events: readonly SimEvent[],
  bufferId: string,
): BufferFlash {
  const flash: BufferFlash = {
    put: false,
    taken: false,
    overflow: false,
    underflow: false,
  };
  for (const event of events) {
    if (event.type === 'BUFFER_PUT' && event.buffer === bufferId) {
      flash.put = true;
    } else if (event.type === 'BUFFER_TAKEN' && event.buffer === bufferId) {
      flash.taken = true;
    } else if (event.type === 'BUFFER_OVERFLOW' && event.buffer === bufferId) {
      flash.overflow = true;
    } else if (event.type === 'BUFFER_UNDERFLOW' && event.buffer === bufferId) {
      flash.underflow = true;
    }
  }
  return flash;
}
