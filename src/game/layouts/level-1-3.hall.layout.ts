import type { HallLayout, Point, Rect } from './types';

/** Titik berurutan baris demi baris (kiri ke kanan, atas ke bawah). */
function grid(xs: readonly number[], ys: readonly number[]): Point[] {
  return ys.flatMap((y) => xs.map((x) => ({ x, y })));
}

const HALL_RECT: Rect = { x: 760, y: 190, width: 300, height: 320 };
/** Pintu aula: tengah tepi kiri aula. */
const DOOR: Point = { x: HALL_RECT.x, y: 350 };

/**
 * Aula Level 1-3 (kanvas 1280x720), dari kiri ke kanan: zona kerja, antrean
 * menuju pintu aula, aula (3 mesin dan tempat luapan), zona selesai. Rak Kartu
 * Akses di atas aula. Titik antrean berjarak 44 px dari pintu ke kiri (indeks 0
 * paling dekat pintu). Titik luapan dipakai bila jumlah robot di aula melebihi
 * kapasitas (bentrok). Angka di sini disetel ulang setelah dilihat di browser
 * (A2); tes validasi menjaga jumlah titik, zona, dan jarak.
 */
export const hall1_3: HallLayout = {
  kind: 'hall',
  id: '1-3',
  area: 'aula',
  gate: { start: 1, end: 3 },
  workZone: { x: 60, y: 150, width: 260, height: 400 },
  workSpots: grid([120, 260], [210, 300, 390, 480]),
  queueZone: { x: 380, y: 320, width: 360, height: 60 },
  queueSpots: Array.from({ length: 8 }, (_, k) => ({
    x: DOOR.x - 36 - k * 44,
    y: DOOR.y,
  })),
  hall: HALL_RECT,
  door: DOOR,
  machines: [
    { x: 850, y: 250 },
    { x: 850, y: 350 },
    { x: 850, y: 450 },
  ],
  overflowSpots: grid([960, 1020], [230, 300, 370]),
  doneZone: { x: 1100, y: 170, width: 120, height: 280 },
  doneSpots: grid([1130, 1190], [210, 280, 350, 420]),
  tokenRack: { x: 910, y: 125 },
};
