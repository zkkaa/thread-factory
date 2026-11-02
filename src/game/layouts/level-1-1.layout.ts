import type { LoopLayout } from './types';

/**
 * Loop bersama Level 1-1 (kanvas 1280x720): jalan kotak-bulat 576x288 px
 * (jalan selebar 64 px, ubin aset dibesarkan 2x), dipusatkan di (640, 360)
 * agar ada ruang lega di sekeliling untuk HUD dan dekorasi latar.
 *
 * Garis tengah jalan: sisi atas dan bawah 384 px, sisi kiri dan kanan 96 px,
 * busur sudut (jari-jari 64) sekitar 100,5 px, total sekitar 1362,1 px.
 * Checkpoint di tengah tiap sisi lurus; slot sekitar 60% di sepanjang busur
 * sudut (slot 0 di sisi atas, sebelum WORK). Fraksi dihitung dari
 * roadGeometry.buildRoad; bila ukuran loop berubah, hitung ulang.
 */
export const layout1_1: LoopLayout = {
  kind: 'loop',
  id: '1-1',
  road: { left: 352, top: 216, width: 576, height: 288 },
  checkpoints: [0.141, 0.391, 0.641, 0.891],
  slots: [0.0558, 0.3262, 0.4705, 0.8262, 0.9705],
  laneOffsets: [-16, 16],
  board: { x: 530, y: 305, width: 220, height: 110 },
  boardLinks: [
    { checkpoint: 1, direction: 'read' },
    { checkpoint: 3, direction: 'write' },
  ],
};
