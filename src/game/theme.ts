import type { ThreadState } from '../engine/types';

/**
 * Semua ukuran dan warna tampilan arena ada di sini, supaya mengganti gaya
 * (mis. dari kotak geometris ke sprite) cukup menyentuh satu tempat.
 * Isinya data dan dua fungsi posisi kecil; tidak ada aturan permainan.
 */

/** Ukuran kanvas; harus sama dengan width/height di game/main.ts. */
export const ARENA = { width: 1024, height: 768 } as const;

/** Sisi satu ubin (satu ubin = satu instruksi), dalam piksel. */
export const TILE_SIZE = 64;

/** Sisi kotak robot; lebih kecil dari ubin agar ubin di bawahnya tetap terbaca. */
export const ROBOT_SIZE = 40;

/**
 * Tata letak jalur robot. Tiap robot punya satu jalur (baris):
 * nama dan state di kiri (`labelX`), deretan ubin mulai dari `startX`.
 */
export const LANE = {
  labelX: 120,
  startX: 250,
  topY: 190,
  gapY: 110,
} as const;

/** Titik tengah ubin ke-`index` pada sumbu x. */
export function tileCenterX(index: number): number {
  return LANE.startX + index * TILE_SIZE + TILE_SIZE / 2;
}

/** Titik tengah jalur ke-`laneIndex` pada sumbu y. */
export function laneCenterY(laneIndex: number): number {
  return LANE.topY + laneIndex * LANE.gapY;
}

/**
 * Gaya tiap state thread. Warna SELALU dipasangkan dengan label teks supaya
 * state tetap terbaca oleh pemain yang sulit membedakan warna.
 * Label memakai istilah teknis bahasa Inggris, sesuai PRD bagian 6.
 */
export const STATE_STYLE: Record<ThreadState, { color: number; label: string }> = {
  NEW: { color: 0x9ca3af, label: 'NEW' },
  READY: { color: 0xf59e0b, label: 'READY' },
  RUNNING: { color: 0x22c55e, label: 'RUNNING' },
  WAITING: { color: 0xef4444, label: 'WAITING' },
  TERMINATED: { color: 0x64748b, label: 'TERMINATED' },
};

/** Gaya pintu kunci (mutex). Warna selalu disertai label teks. */
export const DOOR_STYLE = {
  free: { color: 0x22c55e, label: 'BEBAS' },
  locked: { color: 0xef4444, label: 'TERKUNCI' },
} as const;

/** Panel status pintu di sisi kanan arena; satu panel per mutex, disusun ke bawah. */
export const DOOR_PANEL = {
  x: 905,
  topY: 190,
  gapY: 130,
  width: 200,
  height: 110,
} as const;

export const COLORS = {
  background: '#1f2937',
  tile: 0x374151,
  tileBorder: 0x6b7280,
  robotBorder: 0xf9fafb,
  text: '#f9fafb',
} as const;

export const TEXT_STYLE = {
  fontFamily: 'Arial, sans-serif',
  fontSize: '16px',
  color: COLORS.text,
  align: 'center',
};

/** Teks kecil nama instruksi di dalam ubin. */
export const TILE_TEXT_STYLE = {
  fontFamily: 'Arial, sans-serif',
  fontSize: '11px',
  color: '#d1d5db',
  align: 'center',
};