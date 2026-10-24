import type { ThreadState } from '../engine/types';

/**
 * Semua ukuran dan warna tampilan arena ada di sini, supaya mengganti gaya
 * (mis. dari kotak geometris ke sprite) cukup menyentuh satu tempat.
 * File ini hanya berisi data: tidak ada aturan permainan.
 */

/** Ukuran kanvas; harus sama dengan width/height di game/main.ts. */
export const ARENA = { width: 1024, height: 768 } as const;

/** Sisi satu ubin (dan kotak robot), dalam piksel. */
export const TILE_SIZE = 64;

/** Susunan sementara robot: jumlah kolom dan jarak antar sel. */
export const LAYOUT = {
  columns: 6,
  cellSize: 150,
  topY: 200,
} as const;

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

export const COLORS = {
  background: '#1f2937',
  tileBorder: 0xf9fafb,
  text: '#f9fafb',
} as const;

export const TEXT_STYLE = {
  fontFamily: 'Arial, sans-serif',
  fontSize: '16px',
  color: COLORS.text,
  align: 'center',
};