import type { HallLayout, Point, Rect } from './types';

/** Titik berurutan baris demi baris (kiri ke kanan, atas ke bawah). */
function grid(xs: readonly number[], ys: readonly number[]): Point[] {
  return ys.flatMap((y) => xs.map((x) => ({ x, y })));
}

const HALL_RECT: Rect = { x: 875, y: 170, width: 240, height: 380 };
/** Pintu aula: tepi kiri aula, sejajar dengan mesin tengah. */
const DOOR: Point = { x: HALL_RECT.x, y: 370 };
/** Kolom antrean dari yang paling dekat pintu ke yang paling jauh (jarak 70 px). */
const QUEUE_XS = [815, 745, 675, 605];

/**
 * Aula Level 1-3 (kanvas 1280x720), semuanya di dalam HUD_SAFE (theme.ts), dari
 * kiri ke kanan: area kerja, antrean menuju pintu aula (dua baris, indeks 0
 * paling dekat pintu), aula (3 mesin dan tempat luapan untuk saat bentrok),
 * lalu zona selesai. Rak Kartu Akses di atas antrean. Jarak antar titik 70 px
 * ke samping dan 80 px ke bawah supaya label robot tidak bertumpuk. Angka
 * disetel dari tangkapan layar; tes validasi menjaga jumlah titik, zona,
 * jarak, dan batas HUD.
 */
export const hall1_3: HallLayout = {
  kind: 'hall',
  id: '1-3',
  area: 'aula',
  gate: { start: 1, end: 3 },
  workZone: { x: 355, y: 170, width: 200, height: 350 },
  workSpots: grid([415, 495], [210, 290, 370, 450]),
  queueZone: { x: 575, y: 315, width: 290, height: 210 },
  queueSpots: [DOOR.y, DOOR.y + 80].flatMap((y) =>
    QUEUE_XS.map((x) => ({ x, y })),
  ),
  hall: HALL_RECT,
  door: DOOR,
  machines: [270, 370, 470].map((y) => ({ x: 925, y })),
  overflowSpots: grid([995, 1065], [270, 370, 470]),
  doneZone: { x: 1125, y: 170, width: 135, height: 380 },
  doneSpots: grid([1160, 1230], [210, 290, 370, 450]),
  tokenRack: { x: 715, y: 130 },
};
