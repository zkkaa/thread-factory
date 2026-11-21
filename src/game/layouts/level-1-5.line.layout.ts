import type { LineLayout } from './types';

/**
 * Lini lurus Level 1-5 (kanvas 1280x720), semuanya di dalam ARENA_SAFE dan di
 * atas DOCK_ZONE (y < 418). Tiga lajur (y 135, 215, 295) berbagi x: slot k di
 * 480 + 94k, checkpoint k tepat 47 px sesudahnya. Di bawah lajur: kartu
 * Pengepak, Papan Stok, panel Pintu Kunci, panel Aula. Penyimpanan di kanan.
 * Koordinat awal; disetel ulang setelah melihat hasil nyata.
 */
export const layout1_5Line: LineLayout = {
  kind: 'line',
  id: '1-5',
  tools: { mutexId: 'meja', semaphoreId: 'kartu', conditionId: 'lampu' },
  lanes: [
    { threadId: 'A', y: 135, label: { x: 358, y: 111, width: 98, height: 48 } },
    { threadId: 'W', y: 215, label: { x: 358, y: 191, width: 98, height: 48 } },
    { threadId: 'P', y: 295, label: { x: 358, y: 271, width: 98, height: 48 } },
  ],
  checkpointX: [527, 621, 715, 809, 903, 997, 1091],
  slotX: [480, 574, 668, 762, 856, 950, 1044, 1138],
  hall: {
    id: 'aula',
    zone: { x: 873, y: 100, width: 248, height: 232 },
    gate: { start: 4, end: 6 },
  },
  board: { x: 620, y: 345, width: 300, height: 62 },
  boardLinks: [
    { checkpoint: 1, direction: 'read' },
    { checkpoint: 3, direction: 'write' },
  ],
  storage: { x: 1170, y: 100, width: 90, height: 232 },
  packer: {
    threadId: 'P',
    card: { x: 358, y: 345, width: 250, height: 62 },
    lamp: { x: 385, y: 376 },
    battery: { x: 480, y: 392 },
  },
  mutexPanel: { x: 935, y: 345, width: 150, height: 62 },
  areaPanel: { x: 1100, y: 345, width: 160, height: 62 },
};