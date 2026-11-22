import type { FlowLayout, Point } from './types';

/** Baris titik robot (sama di semua zona agar rapi sejajar). */
const ROWS = [245, 315, 385, 455] as const;
/** Urutan baris dari yang paling dekat pintu/gerbang (y = 350). */
const NEAR_DOOR = [315, 385, 245, 455] as const;

/** Titik baris demi baris (kiri ke kanan, atas ke bawah). */
function grid(xs: readonly number[], ys: readonly number[]): Point[] {
  return ys.flatMap((y) => xs.map((x) => ({ x, y })));
}

/** Titik kolom demi kolom, mengikuti urutan `xs` (kolom terdekat pintu dahulu). */
function columns(xs: readonly number[], ys: readonly number[]): Point[] {
  return xs.flatMap((x) => ys.map((y) => ({ x, y })));
}

/**
 * Arena alur Level 1-5 (kanvas 1280x720), semuanya di dalam HUD_SAFE.
 * Dari kiri ke kanan: A kerja (x 355) | B aula (x 480) | C papan stok (x 720)
 * | D pengepak (x 960) | E selesai (x 1085). Jarak antar titik minimal 60 px
 * (HALL.minSpotGap). Angka disetel dari tangkapan layar; tes validasi menjaga
 * jumlah titik, zona, jarak, dan batas HUD.
 */
export const flow1_5: FlowLayout = {
  kind: 'flow',
  id: '1-5-flow',
  area: 'aula',
  packerId: 'P',
  tools: { mutexId: 'meja', semaphoreId: 'kartu', conditionId: 'lampu' },
  hallSpan: { start: 1, end: 3 },
  stockSpan: { start: 4, end: 6 },

  workZone: { x: 355, y: 140, width: 115, height: 430 },
  workSpots: grid([380, 440], ROWS),

  hallZone: { x: 480, y: 140, width: 230, height: 430 },
  hallQueueSpots: columns([560, 500], NEAR_DOOR),
  hallDoor: { x: 590, y: 350 },
  machines: [
    { x: 620, y: 315 },
    { x: 620, y: 385 },
  ],
  overflowSpots: [
    { x: 680, y: 315 },
    { x: 680, y: 385 },
    { x: 620, y: 245 },
    { x: 680, y: 245 },
    { x: 620, y: 455 },
    { x: 680, y: 455 },
  ],

  stockZone: { x: 720, y: 140, width: 230, height: 430 },
  stockBoard: { x: 730, y: 168, width: 210, height: 54 },
  stockQueueSpots: columns([810, 750], NEAR_DOOR),
  stockDoor: { x: 840, y: 350 },
  stockSpots: grid([870, 930], ROWS),

  packZone: { x: 960, y: 140, width: 115, height: 430 },
  packerSpot: { x: 1017, y: 330 },
  lamp: { x: 1017, y: 260 },
  battery: { x: 1010, y: 420 },

  doneZone: { x: 1085, y: 140, width: 125, height: 430 },
  doneSpots: grid([1115, 1175], ROWS),
};