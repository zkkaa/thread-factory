import type { LaneHallLayout } from './types';

/**
 * Aula Level 1-3, diukur dari background `world/bg-level-1-3.jpg` (1280x720).
 * Disetel ulang dengan mode debug bila gambar diganti.
 *
 * Alur: pijakan (kolom kiri) -> sumbu tegak -> lajur atas atau bawah ->
 * antrean -> gerbang -> belok -> bergabung -> Area Kerja -> panel EXIT.
 *
 * Slot (program 4 instruksi -> 5 slot):
 *  0 sebelum WORK (di sumbu tegak), 1 sebelum ENTER_AREA (gerbang),
 *  2 dan 3 di dalam Area Kerja, 4 sesudah LEAVE_AREA (depan EXIT).
 */
export const layout1_3Lanes: LaneHallLayout = {
  kind: 'laneHall',
  id: '1-3',
  slots: [
    { x: 463, y: 355 },
    { x: 800, y: 353 },
    { x: 1031, y: 300 },
    { x: 1107, y: 300 },
    { x: 1148, y: 356 },
  ],
  // Pusat 8 kotak pada kolom: robot 0 sampai 3 ke lajur atas, 4 sampai 7 ke bawah.
  prepSpots: [207, 252, 297, 340, 385, 430, 473, 515].map((y) => ({
    x: 375,
    y,
  })),
  spineX: 463,
  lanes: [
    {
      y: 284,
      turn: { x: 940, y: 284 },
      queueSpots: [670, 630, 590, 550].map((x) => ({ x, y: 284 })),
      robots: [0, 1, 2, 3],
    },
    {
      y: 423,
      turn: { x: 940, y: 423 },
      queueSpots: [670, 630, 590, 550].map((x) => ({ x, y: 423 })),
      robots: [4, 5, 6, 7],
    },
  ],
  gate: { x: 800, y: 353 },
  merge: { x: 978, y: 356 },
  // Grid 3x3 di dalam Area Kerja (8 terpakai); baris atas = tiga mesin.
  areaSpots: Array.from({ length: 9 }, (_, i) => ({
    x: 1031 + (i % 3) * 38,
    y: 317 + Math.floor(i / 3) * 38,
  })),
  areaBox: { x: 1009, y: 295, width: 121, height: 121 },
  exitSpot: { x: 1148, y: 356 },
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
  },
};