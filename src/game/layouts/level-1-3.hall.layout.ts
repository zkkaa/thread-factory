import type { HallLayout, Point, Rect } from './types';

/** Titik berurutan baris demi baris (kiri ke kanan, atas ke bawah). */
function grid(xs: readonly number[], ys: readonly number[]): Point[] {
  return ys.flatMap((y) => xs.map((x) => ({ x, y })));
}

/** Bingkai Area Kerja pada background (bg-level-1-3.jpg). */
const HALL_RECT: Rect = { x: 1009, y: 295, width: 121, height: 121 };
/** Sumbu y dua lajur masuk pada background. */
const LANE_YS = [284, 423];
/** Pusat gerbang: titik sasaran lepas Kartu Akses dan letak sprite gerbang. */
const DOOR: Point = { x: 800, y: 353 };

/**
 * Aula Level 1-3 (kanvas 1280x720) di atas background gambar
 * `world/bg-level-1-3.jpg`. Dari kiri ke kanan: kolom pijakan (area kerja),
 * dua lajur antrean menuju gerbang, Area Kerja (tiga mesin dan tempat luapan
 * untuk bentrok), dan baris "selesai" di bagian atas yang kosong. Jalan,
 * lantai, dan bingkai adalah bagian gambar; kolom pijakan dan gerbang adalah
 * sprite (`art`). Angka diukur dari gambar dan disetel ulang dengan mata;
 * tes validasi menjaga jumlah titik, zona, jarak, dan batas HUD.
 *
 * Jarak antar titik dilonggarkan (`minSpotGap`) karena Area Kerja pada gambar
 * hanya 121 px. Antrean berselang-seling antara lajur atas dan bawah:
 * indeks 0 dan 1 paling dekat gerbang, sehingga urutan FIFO semaphore tampak
 * bergantian di dua lajur.
 */
export const hall1_3: HallLayout = {
  kind: 'hall',
  id: '1-3',
  area: 'aula',
  gate: { start: 1, end: 3 },
  workZone: { x: 350, y: 185, width: 110, height: 355 },
  workSpots: [207, 252, 297, 340, 385, 430, 473, 515].map((y) => ({
    x: 375,
    y,
  })),
  queueZone: { x: 480, y: 262, width: 210, height: 182 },
  queueSpots: [670, 630, 590, 550].flatMap((x) =>
    LANE_YS.map((y) => ({ x, y })),
  ),
  hall: HALL_RECT,
  door: DOOR,
  machines: [1031, 1069, 1107].map((x) => ({ x, y: 317 })),
  overflowSpots: grid([1031, 1069, 1107], [355, 393]),
  doneZone: { x: 480, y: 100, width: 520, height: 60 },
  doneSpots: Array.from({ length: 8 }, (_, i) => ({ x: 510 + i * 62, y: 130 })),
  tokenRack: { x: 1050, y: 500 },
  minSpotGap: 36,
  art: {
    column: { x: 331, y: 185, scale: 0.4255 },
    gate: {
      x: 690,
      y: 192,
      scale: 0.502,
      lamps: [
        { x: 766, y: 241 },
        { x: 800, y: 241 },
        { x: 834, y: 241 },
      ],
      lampRadius: 11,
    },
    machineSize: 30,
  },
};