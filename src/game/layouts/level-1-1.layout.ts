import type { LoopLayout } from './types';

/**
 * Loop bersama Level 1-1 (kanvas 1280x720): jalan kotak-bulat 640x448 px,
 * dipusatkan di arena agar ada ruang lega di sekelilingnya untuk HUD.
 * Checkpoint berada di tengah sisi lurus; papan stok berada di tengah loop.
 */
export const layout1_1: LoopLayout = {
  kind: 'loop',
  id: '1-1',
  road: { left: 320, top: 136, width: 640, height: 448 },
  checkpoints: [0.0887, 0.3386, 0.5884, 0.8386],
  slots: [0.04, 0.265, 0.445, 0.765, 0.945],
  laneOffsets: [-32, 32],
  board: { x: 530, y: 305, width: 220, height: 110 },
  boardLinks: [
    { checkpoint: 1, direction: 'read' },
    { checkpoint: 3, direction: 'write' },
  ],
};