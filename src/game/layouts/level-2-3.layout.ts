import type { TableLayout } from './types';

/**
 * Arena Level 2-3 (Meja Teknisi).
 * 5 teknisi (T1-T5) dan 5 kunci (fork0-fork4) melingkar.
 * Koordinat berada di dalam HUD_SAFE (x 350..1260, y 80..580).
 */
export const layout2_3: TableLayout = {
  kind: 'table',
  id: '2-3',
  center: { x: 805, y: 330 },
  radius: 180,
  technicianIds: ['T1', 'T2', 'T3', 'T4', 'T5'],
  forkIds: ['fork0', 'fork1', 'fork2', 'fork3', 'fork4'],
  coffmanZone: { x: 1050, y: 450, width: 200, height: 120 },
  preemptButton: { x: 805, y: 550 },
};
