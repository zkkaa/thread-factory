import type { LoopLayout } from './types';

/**
 * Loop bersama Level 1-1 (kanvas 1280x720): 4 checkpoint (WORK, READ,
 * COMPUTE, WRITE), 5 slot, papan stok di tengah yang terhubung ke READ
 * (kanan) dan WRITE (kiri). Jalan searah jarum jam. Area kiri atas dan
 * bawah dibiarkan lega untuk HUD.
 */
export const layout1_1: LoopLayout = {
  kind: 'loop',
  id: '1-1',
  path: [
    { x: 388, y: 244 },
    { x: 600, y: 200 },
    { x: 812, y: 244 },
    { x: 900, y: 350 },
    { x: 812, y: 456 },
    { x: 600, y: 500 },
    { x: 388, y: 456 },
    { x: 300, y: 350 },
  ],
  checkpoints: [0.12, 0.35, 0.6, 0.85],
  slots: [0.04, 0.235, 0.475, 0.725, 0.93],
  laneOffsets: [-22, 22],
  board: { x: 490, y: 295, width: 220, height: 110 },
  boardLinks: [
    { checkpoint: 1, direction: 'read' },
    { checkpoint: 3, direction: 'write' },
  ],
};
