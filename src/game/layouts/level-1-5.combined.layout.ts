import type { CombinedLayout } from './types';

/**
 * Lini gabungan Level 1-5 (kanvas 1280x720), semuanya di dalam ARENA_SAFE dan
 * di luar DOCK_ZONE (theme.ts).
 *
 * Loop bersama di kiri-atas: jalan 512x256 px (x 380..892, y 100..356).
 * Garis tengah: sisi atas dan bawah 320 px, sisi kiri dan kanan 64 px, empat
 * busur sekitar 100,5 px; total sekitar 1170,1 px. Tujuh checkpoint berjarak
 * 155 px (mulai 105 px dari awal sisi atas); slot k berada 70 px sebelum
 * checkpoint k, dan slot terakhir 70 px sesudah checkpoint terakhir.
 * Fraksi dihitung dari roadGeometry.buildRoad; bila ukuran loop berubah,
 * hitung ulang.
 *
 * Empat kartu stasiun ditumpuk di kolom kanan (x 910..1260, di luar jangkauan
 * dok): Perakit, Penggudang (memuat panel Pintu Kunci), Aula Mesin, Pengepak.
 */
export const layout1_5: CombinedLayout = {
  kind: 'combined',
  id: '1-5',
  tools: { mutexId: 'meja', semaphoreId: 'kartu', conditionId: 'lampu' },
  road: { left: 380, top: 100, width: 512, height: 256 },
  checkpoints: [0.0897, 0.2222, 0.3547, 0.4871, 0.6196, 0.7521, 0.8845],
  slots: [0.0299, 0.1624, 0.2948, 0.4273, 0.5598, 0.6922, 0.8247, 0.9444],
  laneOffsets: [-20, 0, 20],
  board: { x: 516, y: 188, width: 240, height: 80 },
  boardLinks: [
    { checkpoint: 1, direction: 'read' },
    { checkpoint: 3, direction: 'write' },
  ],
  assembler: {
    threadId: 'A',
    zone: { x: 910, y: 92, width: 350, height: 105 },
  },
  warehouse: {
    threadId: 'W',
    zone: { x: 910, y: 205, width: 350, height: 105 },
    doorPanel: { x: 925, y: 262, width: 320, height: 40 },
  },
  area: {
    id: 'aula',
    zone: { x: 910, y: 318, width: 350, height: 105 },
    gate: { start: 4, end: 6 },
    door: { x: 932, y: 378 },
    machines: [{ x: 975, y: 378 }],
  },
  packer: {
    threadId: 'P',
    zone: { x: 910, y: 431, width: 350, height: 105 },
    lamp: { x: 945, y: 474 },
    battery: { x: 985, y: 520 },
  },
};
