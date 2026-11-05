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
  workZone: { x: 370, y: 200, width: 220, height: 260 },
  table: { x: 650, y: 250, width: 240, height: 150 },
  packZone: { x: 950, y: 200, width: 280, height: 260 },
  assemblerSpot: { x: 480, y: 320 },
  packerSpot: { x: 1090, y: 290 },
  lamp: { x: 770, y: 205 },
  battery: { x: 1090, y: 410 },
};
