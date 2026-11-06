import type { CombinedLayout } from './types';

/**
 * Lini gabungan Level 1-5 (kanvas 1280x720). Jalur dan papan berada di bagian
 * atas, sedangkan empat stasiun kerja ditata sejajar di bagian bawah agar
 * tidak tertutup HUD.
 */
export const layout1_5: CombinedLayout = {
  kind: 'combined',
  id: '1-5',
  tools: { mutexId: 'meja', semaphoreId: 'kartu', conditionId: 'lampu' },
  road: { left: 520, top: 120, width: 448, height: 224 },
  checkpoints: [0.07, 0.19, 0.31, 0.43, 0.57, 0.7, 0.83],
  slots: [0.035, 0.13, 0.25, 0.37, 0.5, 0.64, 0.77, 0.94],
  laneOffsets: [-20, 0, 20],
  board: { x: 624, y: 190, width: 240, height: 80 },
  boardLinks: [
    { checkpoint: 4, direction: 'read' },
    { checkpoint: 6, direction: 'write' },
  ],
  assembler: {
    threadId: 'A',
    zone: { x: 355, y: 390, width: 210, height: 170 },
  },
  warehouse: {
    threadId: 'W',
    zone: { x: 575, y: 390, width: 210, height: 170 },
  },
  area: {
    id: 'aula',
    zone: { x: 795, y: 390, width: 210, height: 170 },
    gate: { start: 4, end: 6 },
    door: { x: 820, y: 475 },
    machines: [{ x: 900, y: 475 }],
  },
  packer: {
    threadId: 'P',
    zone: { x: 1015, y: 390, width: 240, height: 170 },
    lamp: { x: 1135, y: 448 },
    battery: { x: 1100, y: 526 },
  },
};
