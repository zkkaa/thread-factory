import type { TableLayout } from './types';

/**
 * Meja bundar Level 2-3. Lima teknisi pada jari-jari 170 px dan lima kunci pada
 * jari-jari 100 px, pusat (805, 330). Semua di dalam HUD_SAFE (x 350..1260,
 * y 80..580). Teknisi ke-i duduk pada sudut -90 + 72 * i derajat; kunci ke-i di
 * antara teknisi i dan i+1 (sudut -54 + 72 * i), sama seperti leftFork/rightFork
 * di level-2-3.scenario.ts.
 */
export const layout2_3: TableLayout = {
  kind: 'table',
  id: '2-3',
  table: { center: { x: 805, y: 330 }, radius: 125 },
  seatIds: ['T1', 'T2', 'T3', 'T4', 'T5'],
  seats: [
    { x: 805, y: 160 },
    { x: 967, y: 278 },
    { x: 905, y: 468 },
    { x: 705, y: 468 },
    { x: 643, y: 278 },
  ],
  forkIds: ['kunci-1', 'kunci-2', 'kunci-3', 'kunci-4', 'kunci-5'],
  forks: [
    { x: 864, y: 249 },
    { x: 900, y: 361 },
    { x: 805, y: 430 },
    { x: 710, y: 361 },
    { x: 746, y: 249 },
  ],
  coffmanPanel: { x: 360, y: 140 },
};
