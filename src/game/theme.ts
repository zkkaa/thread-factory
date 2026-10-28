import type { ThreadState } from '../engine/types';

/**
- Semua ukuran dan warna tampilan arena ada di sini, supaya mengganti gaya
- (mis. dari kotak geometris ke sprite) cukup menyentuh satu tempat.
- Isinya data dan dua fungsi posisi kecil; tidak ada aturan permainan.
 */

/** Ukuran kanvas; harus sama dengan width/height di game/main.ts. */
export const ARENA = { width: 1280, height: 720 } as const;

/** Sisi satu ubin (satu ubin = satu instruksi), dalam piksel. */
export const TILE_SIZE = 64;

/** Sisi kotak robot; lebih kecil dari ubin agar ubin di bawahnya tetap terbaca. */
export const ROBOT_SIZE = 24;

/**
- Tata letak jalur robot. Tiap robot punya satu jalur (baris):
- nama dan state di kiri (`labelX`), deretan ubin mulai dari `startX`.
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
- Gaya tiap state thread. Warna SELALU dipasangkan dengan label teks supaya
- state tetap terbaca oleh pemain yang sulit membedakan warna.
- Label memakai istilah teknis bahasa Inggris, sesuai PRD bagian 6.
 */
export const STATE_STYLE: Record<
  ThreadState,
  { color: number; label: string }
> = {
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
  x: 1140,
  topY: 230,
  gapY: 130,
  width: 200,
  height: 110,
  padding: 16,
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

/** Jalan robot (U-053). Lebar cukup untuk dua jalur sejajar. */
export const ROAD = {
  width: 50,
  color: 0x2b364f,
  edge: 0x4b5b80,
  arrow: 0x93a4c8,
} as const;

/** Checkpoint bulat (U-054). */
export const CHECKPOINT = {
  radius: 50,
  fill: 0x1f2a44,
  stroke: 0xf5c542,
  hover: 0xffffff,
  tooltipWidth: 220,
} as const;

/** Papan stok dan tautan ke READ/WRITE (U-057). */
export const BOARD_STYLE = {
  fill: 0x1f2a44,
  stroke: 0xf5c542,
  link: 0x93a4c8,
  /** Jarak panah aliran dari checkpoint (piksel). */
  arrowOffset: 80,
  /** Skala angka papan saat berubah. */
  popScale: 1.25,
} as const;

/** Label kecil di dekat robot dan tooltip checkpoint. */
export const LABEL_STYLE = {
  fontFamily: 'Arial, sans-serif',
  fontSize: '12px',
  color: COLORS.text,
  align: 'center',
  backgroundColor: 'rgba(15,24,48,0.8)',
  padding: { x: 6, y: 3 },
};

/** Durasi animasi kecil, dalam milidetik. */
export const MOTION = { popMs: 120, minPulseMs: 200 } as const;

/** Urutan tumpukan gambar; makin besar makin di depan. */
export const DEPTH = {
  track: -2,
  segment: -1,
  slot: 2,
  gate: 3,
  lock: 4,
  robot: 5,
  robotLabel: 6,
  tooltip: 100,
  robotGlow: 4.5,
  robotFx: 6.5,
} as const;

/** Ukuran gerbang, segmen terlindungi, dan ikon gembok (U-058). */
export const DOOR_GEOMETRY = {
  barThickness: 8,
  labelGap: 10,
  panelStroke: 3,
  segmentAlpha: 0.3,
  segmentSteps: 24,
  lockSize: 14,
} as const;

/**
 * Penanda slot pemasangan pintu (U-060). Slot sah dibedakan dari yang lain
 * lewat ukuran dan isi (bukan hanya warna); slot yang disorot diberi cincin.
 */
export const SLOT_STYLE = {
  radius: 8,
  validScale: 1.5,
  hoverScale: 1.9,
  /** Jarak terjauh (piksel) dari titik lepas ke slot agar dianggap mengena. */
  hitRadius: 48,
  idleAlpha: 0.3,
  idleColor: 0xf5c542,
  validColor: 0x22c55e,
  hoverColor: 0xffffff,
  ringWidth: 3,
} as const;
/** Efek visual Si Penjadwal pada robot (U-059). */
export const ROBOT_FX = {
  /** Cincin RUNNING: tambahan ukuran di tiap sisi robot. */
  glowPadding: 8,
  glowColor: 0xbbf7d0,
  glowFillAlpha: 0.25,
  glowStroke: 3,
  pulseScale: 1.18,
  pulseMs: 600,
  /** READY dibekukan: pudar dan bergaris tepi biru es. */
  frozenAlpha: 0.55,
  iceColor: 0x93c5fd,
  iceStroke: 3,
  /** Penanda zzz: jarak dari tepi robot dan jarak melayang (piksel). */
  zzzGap: 4,
  zzzFloat: 6,
  zzzFloatMs: 900,
} as const;

export const ROBOT_FX_TEXT: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'monospace',
  fontSize: '14px',
  fontStyle: 'bold',
  color: '#bfdbfe',
};
