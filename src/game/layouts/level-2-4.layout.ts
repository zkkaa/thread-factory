import type { CombinedLayout } from './types';

/**
 * Arena Level 2-4 (Lini Produksi Penuh).
 * Karena ini adalah level gabungan (CombinedLayout), kita tidak menggunakan
 * jalur robot (road) yang mengharuskan checkpoint dan slot. Layout ini
 * menempatkan tiga zona (perakit, penggudang, pengepak) di dalam HUD_SAFE.
 *
 * Semua koordinat berada di dalam HUD_SAFE (x 350..1260, y 80..580).
 */
export const layout2_4: CombinedLayout = {
  kind: 'combined',
  id: '2-4',
  tools: { mutexId: 'meja', semaphoreId: 'ban', conditionId: 'papan' },
  road: { left: 400, top: 180, width: 256, height: 192 },
  checkpoints: [0.1, 0.3, 0.5, 0.7],
  slots: [0.05, 0.2, 0.4, 0.6, 0.8],
  laneOffsets: [0, 0, 0],
  board: { x: 496, y: 244, width: 64, height: 64 },
  boardLinks: [
    { checkpoint: 1, direction: 'read' },
    { checkpoint: 3, direction: 'write' },
  ],
  assembler: {
    threadId: 'P',
    zone: { x: 360, y: 390, width: 140, height: 90 },
  },
  warehouse: {
    threadId: 'W',
    zone: { x: 520, y: 390, width: 140, height: 90 },
  },
  area: {
    id: 'ban',
    zone: { x: 680, y: 390, width: 180, height: 120 },
    gate: { start: 1, end: 3 },
    door: { x: 700, y: 400 },
    machines: [
      { x: 730, y: 420 },
      { x: 770, y: 420 },
      { x: 810, y: 420 },
    ],
  },
  packer: {
    threadId: 'C',
    zone: { x: 880, y: 390, width: 140, height: 90 },
    lamp: { x: 920, y: 410 },
    battery: { x: 920, y: 450 },
  },
};
