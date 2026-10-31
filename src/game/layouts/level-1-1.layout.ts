import type { LoopLayout } from './types';

/**
 * Loop bersama Level 1-1 (kanvas 1280x720): jalan kotak-bulat dari ubin,
 * kotak luar 768x512 (12x8 satuan 64 px). Garis tengah panjang 1828 px:
 * sisi atas 0..0.21, sudut kanan-atas ..0.32, sisi kanan ..0.39, sudut
 * kanan-bawah ..0.50, sisi bawah ..0.71, sudut kiri-bawah ..0.82, sisi kiri
 * ..0.89, sudut kiri-atas ..1.0. Satu checkpoint di tengah tiap sisi (WORK
 * atas, READ kanan, COMPUTE bawah, WRITE kiri); slot di sudut. Papan stok di
 * lubang tengah. Kiri atas dan bawah dibiarkan lega untuk HUD.
 */
export const layout1_1: LoopLayout = {
  kind: 'loop',
  id: '1-1',
  road: { left: 256, top: 80, width: 768, height: 512 },
  checkpoints: [0.105, 0.355, 0.605, 0.855],
  slots: [0.04, 0.265, 0.445, 0.765, 0.945],
  laneOffsets: [-32, 32],
  board: { x: 530, y: 281, width: 220, height: 110 },
  boardLinks: [
    { checkpoint: 1, direction: 'read' },
    { checkpoint: 3, direction: 'write' },
  ],
};
