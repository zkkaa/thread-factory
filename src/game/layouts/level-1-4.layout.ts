import type { TableLayout } from './types';

/**
 * Meja barang Level 1-4 (kanvas 1280x720), semuanya di dalam HUD_SAFE
 * (theme.ts): perakit di kiri, meja barang di tengah, pengepak dan meter
 * baterainya di kanan, lampu sinyal di atas meja. Angka ini placeholder awal
 * dan akan disetel dari tangkapan layar; tes validasi menjaga zona, jarak,
 * dan batas HUD.
 */
export const layout1_4: TableLayout = {
  kind: 'table',
  id: '1-4',
  assemblerId: 'A',
  packerId: 'P',
  workZone: { x: 380, y: 220, width: 220, height: 260 },
  table: { x: 660, y: 280, width: 220, height: 150 },
  packZone: { x: 940, y: 220, width: 260, height: 260 },
  assemblerSpot: { x: 490, y: 340 },
  packerSpot: { x: 1070, y: 310 },
  lamp: { x: 770, y: 250 },
  battery: { x: 1070, y: 430 },
};
