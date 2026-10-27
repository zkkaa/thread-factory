import type { LoopLayout } from './types';

/**
 * Loop bersama Level 1-1: 4 checkpoint (WORK, READ, COMPUTE, WRITE), 5 slot,
 * papan stok di tengah yang terhubung ke READ dan WRITE. Jalan searah jarum
 * jam; checkpoint dan slot berupa fraksi panjang jalan.
 */
export const layout1_1: LoopLayout = {
  kind: 'loop',
  id: '1-1',
  path: [
    { x: 220, y: 260 },
    { x: 512, y: 200 },
    { x: 804, y: 260 },
    { x: 860, y: 400 },
    { x: 804, y: 540 },
    { x: 512, y: 600 },
    { x: 220, y: 540 },
    { x: 164, y: 400 },
  ],
  checkpoints: [0.12, 0.35, 0.6, 0.85],
  slots: [0.04, 0.235, 0.475, 0.725, 0.93],
  laneOffsets: [-14, 14],
  board: { x: 392, y: 330, width: 240, height: 140 },
  boardLinks: [
    { checkpoint: 1, direction: 'read' },
    { checkpoint: 3, direction: 'write' },
  ],
};
