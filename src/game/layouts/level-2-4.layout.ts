import type { TripleLayout } from './types';

/**
 * Arena Level 2-4: tiga arena komponen dalam HUD_SAFE (x 350..1260,
 * y 80..580). Ban di kiri atas, papan di kanan atas, meja teknisi di bawah.
 * Id thread dan resource sama dengan level 2-1, 2-2, dan 2-3. Meja: pusat
 * (805, 455), teknisi pada jari-jari 95, kunci pada jari-jari 55, sudut
 * sama dengan layout 2-3. Koordinat adalah titik awal; setel ulang setelah
 * melihat hasil di browser.
 */
export const layout2_4: TripleLayout = {
  kind: 'triple',
  id: '2-4',
  belt: {
    kind: 'belt',
    id: '2-4-ban',
    bufferId: 'ban',
    belt: { x: 455, y: 130, width: 200, height: 100 },
    producerZone: { x: 360, y: 95, width: 90, height: 170 },
    consumerZone: { x: 660, y: 95, width: 90, height: 170 },
    producerIds: ['P1', 'P2'],
    producerSpots: [
      { x: 405, y: 150 },
      { x: 405, y: 220 },
    ],
    consumerIds: ['C1', 'C2'],
    consumerSpots: [
      { x: 705, y: 150 },
      { x: 705, y: 220 },
    ],
  },
  board: {
    kind: 'board',
    id: '2-4-papan',
    boardId: 'papan',
    board: { x: 905, y: 95, width: 200, height: 230 },
    readerZone: { x: 770, y: 95, width: 130, height: 230 },
    writerZone: { x: 1110, y: 95, width: 140, height: 230 },
    readerIds: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'],
    readerSpots: [
      { x: 805, y: 150 },
      { x: 865, y: 150 },
      { x: 805, y: 210 },
      { x: 865, y: 210 },
      { x: 805, y: 270 },
      { x: 865, y: 270 },
    ],
    writerIds: ['W1', 'W2'],
    writerSpots: [
      { x: 1180, y: 170 },
      { x: 1180, y: 260 },
    ],
  },
  table: {
    kind: 'table',
    id: '2-4-meja',
    table: { center: { x: 805, y: 455 }, radius: 70 },
    seatIds: ['T1', 'T2', 'T3', 'T4', 'T5'],
    seats: [
      { x: 805, y: 360 },
      { x: 895, y: 426 },
      { x: 861, y: 532 },
      { x: 749, y: 532 },
      { x: 715, y: 426 },
    ],
    forkIds: ['kunci-1', 'kunci-2', 'kunci-3', 'kunci-4', 'kunci-5'],
    forks: [
      { x: 837, y: 410 },
      { x: 857, y: 472 },
      { x: 805, y: 510 },
      { x: 753, y: 472 },
      { x: 773, y: 410 },
    ],
  },
};
