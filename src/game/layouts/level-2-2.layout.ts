import type { BoardLayout } from './types';

/** Papan pengumuman Level 2-2; semua di dalam HUD_SAFE (x 350..1260, y 80..580). */
export const layout2_2: BoardLayout = {
  kind: 'board',
  id: '2-2',
  boardId: 'papan',
  board: { x: 590, y: 150, width: 440, height: 330 },
  readerZone: { x: 360, y: 120, width: 200, height: 420 },
  writerZone: { x: 1060, y: 120, width: 190, height: 420 },
  readerIds: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'],
  // Dua kolom, tiga baris: urut R1, R2 (baris atas), R3, R4, R5, R6.
  readerSpots: [
    { x: 420, y: 200 },
    { x: 500, y: 200 },
    { x: 420, y: 320 },
    { x: 500, y: 320 },
    { x: 420, y: 440 },
    { x: 500, y: 440 },
  ],
  writerIds: ['W1', 'W2'],
  writerSpots: [
    { x: 1155, y: 250 },
    { x: 1155, y: 400 },
  ],
};
