import type { HallLayout, Point, Rect } from './types';

/** Titik berurutan baris demi baris (kiri ke kanan, atas ke bawah). */
function grid(xs: readonly number[], ys: readonly number[]): Point[] {
  return ys.flatMap((y) => xs.map((x) => ({ x, y })));
}

const HALL_RECT: Rect = { x: 825, y: 150, width: 270, height: 330 };
/** Pintu aula: tengah tepi kiri aula. */
const DOOR: Point = { x: HALL_RECT.x, y: 310 };
/** Kolom antrean dari yang paling dekat pintu ke yang paling jauh. */
const QUEUE_XS = [785, 723, 661, 599];

/**
 * Aula Level 1-3 (kanvas 1280x720), semuanya di dalam HUD_SAFE (theme.ts), dari
 * kiri ke kanan: area kerja, antrean menuju pintu aula (dua baris, indeks 0
 * paling dekat pintu), aula (3 mesin dan tempat luapan untuk saat bentrok),
 * lalu zona selesai. Rak Kartu Akses di atas antrean. Angka disetel dari
 * tangkapan layar; tes validasi menjaga jumlah titik, zona, jarak, dan batas HUD.
 */
export const hall1_3: HallLayout = {
  kind: 'hall',
  id: '1-3',
  area: 'aula',
  gate: { start: 1, end: 3 },
  workZone: { x: 365, y: 150, width: 180, height: 290 },
  workSpots: grid([410, 500], [190, 260, 330, 400]),
  queueZone: { x: 565, y: 275, width: 250, height: 140 },
  queueSpots: [DOOR.y, DOOR.y + 70].flatMap((y) =>
    QUEUE_XS.map((x) => ({ x, y })),
  ),
  hall: HALL_RECT,
  door: DOOR,
  machines: [220, 310, 400].map((y) => ({ x: 880, y })),
  overflowSpots: grid([965, 1035], [220, 310, 400]),
  doneZone: { x: 1110, y: 150, width: 150, height: 300 },
  doneSpots: grid([1143, 1209], [200, 270, 340, 410]),
  tokenRack: { x: 690, y: 130 },
};
