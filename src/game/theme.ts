import type { ThreadState } from '../engine/types';

/**
 * Semua ukuran dan warna tampilan arena ada di sini, supaya mengganti gaya
 * (mis. dari kotak geometris ke sprite) cukup menyentuh satu tempat.
 * Isinya data dan dua fungsi posisi kecil; tidak ada aturan permainan.
 */

/** Ukuran kanvas; harus sama dengan width/height di game/main.ts. */
export const ARENA = { width: 1280, height: 720 } as const;

/** Sisi satu ubin (satu ubin = satu instruksi), dalam piksel. */
export const TILE_SIZE = 64;

/**
 * Sisi sprite robot. Frame sprite 64 px (ubin 16 px diskalakan 4x) dikecilkan
 * ke 24 px agar dua robot muat berdampingan di jalan selebar ROAD.width.
 * Bukan pengecilan bulat, jadi sedikit lebih lembut dari 32 px.
 */
export const ROBOT_SIZE = 24;

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
  resolution: 2,
  color: COLORS.text,
  align: 'center',
};

/** Teks kecil nama instruksi di dalam ubin. */
export const TILE_TEXT_STYLE = {
  fontFamily: 'Arial, sans-serif',
  fontSize: '11px',
  resolution: 2,
  color: '#d1d5db',
  align: 'center',
};

/**
 * Jalan robot (U-053). Lebar cukup untuk dua jalur sejajar.
 * Aset jalan dibesarkan 2x (ROAD_SCALE di assetManifest.ts); angka di sini
 * HARUS ikut berubah bila skala itu diubah (dicek tes roadGeometry):
 * unit = 16 x skala, width = 32 x skala, corner = 48 x skala.
 */
export const ROAD = {
  /** Satu ubin lurus sepanjang jalan (16 px aset x 2). */
  unit: 32,
  /** Lebar jalan (32 px aset x 2). */
  width: 64,
  /** Sisi ubin sudut (48 px aset x 2). */
  corner: 96,
  color: 0x2b364f,
  edge: 0x4b5b80,
  arrow: 0x93a4c8,
} as const;

/** Checkpoint bulat (U-054). Diameternya hampir sama dengan lebar jalan. */
export const CHECKPOINT = {
  radius: 30,
  fill: 0x1f2a44,
  stroke: 0xf5c542,
  hover: 0xffffff,
  tooltipWidth: 220,
  /** Ikon instruksi di dalam lingkaran (U-073). */
  iconSize: 22,
  /** Ikon digeser ke atas dari pusat, teks diturunkan, supaya muat berdua. */
  iconLift: 9,
  labelDrop: 14,
} as const;

/** Kilau gerbang saat kunci dipegang atau dilepas (U-076). */
export const DOOR_FX = { flashFromAlpha: 0.3, flashMs: 280 } as const;

/** Papan stok dan tautan ke READ/WRITE (U-057). */
export const BOARD_STYLE = {
  fill: 0x1f2a44,
  stroke: 0xf5c542,
  link: 0x93a4c8,
  /** Jarak panah aliran dari checkpoint (piksel). */
  arrowOffset: 80,
  /** Skala angka papan saat berubah. */
  popScale: 1.25,
  /** Ikon peti yang mengapit angka stok. */
  crateSize: 32,
  /** Jarak ikon peti dari tepi kiri dan kanan papan. */
  crateInset: 28,
  /** Ikon sejajar dengan angka (angka digeser turun sebesar ini dari pusat). */
  crateDrop: 12,
} as const;

/** Label kecil di dekat robot dan tooltip checkpoint. */
export const LABEL_STYLE = {
  fontFamily: 'Arial, sans-serif',
  fontSize: '12px',
  resolution: 2,
  color: COLORS.text,
  align: 'center',
  backgroundColor: 'rgba(15,24,48,0.8)',
  padding: { x: 6, y: 3 },
};

/** Durasi animasi kecil, dalam milidetik. */
export const MOTION = { popMs: 120, minPulseMs: 200 } as const;

/** Urutan tumpukan gambar; makin besar makin di depan. */
export const DEPTH = {
  floor: -10,
  track: -2,
  segment: -1,
  slot: 2,
  gate: 3,
  lock: 4,
  robot: 5,
  robotSprite: 5.2,
  robotLabel: 6,
  tooltip: 100,
  robotGlow: 4.5,
  robotFx: 6.5,
  battery: 6.6,
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

/** Sprite robot (U-072): pelat berwarna state di bawah sprite. */
export const ROBOT_SPRITE = {
  /** Tambahan ukuran pelat di tiap sisi sprite (piksel). */
  platePadding: 3,
} as const;

export const ROBOT_FX_TEXT: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'monospace',
  fontSize: '14px',
  resolution: 2,
  fontStyle: 'bold',
  color: '#bfdbfe',
};

// ---------------------------------------------------------------------------
// Rak Kartu Akses / Token Semaphore (TokenView, T-042)
// ---------------------------------------------------------------------------
export const TOKEN_PANEL = {
  width: 160,
  height: 70,
  fillAlpha: 0.9,
  strokeWidth: 2,
  titleY: -22,
  countY: -2,
  queueY: 20,
  queueHeight: 18,
  queuePadding: 20,
  titleFontSize: '11px',
  countFontSize: '14px',
  queueFontSize: '10px',
} as const;

export const TOKEN_COLORS = {
  panel: 0x132238,
  available: 0x14b8a6,
  empty: 0xef4444,
  queueBadge: 0xef4444,
  title: '#2dd4bf',
  count: '#f9fafb',
  queueText: '#ffffff',
} as const;

/**
 * Area di kanvas yang aman dari HUD pada layar minimum 1280x720 (kanvas skala 1).
 * Panel Misi dan Si Penjadwal menutupi sisi kiri sampai x sekitar 333, bar
 * kontrol di atas sampai y sekitar 70, serta toolbox dan log di bawah mulai y
 * sekitar 590 (lebih tinggi bila toolbox dibuka). Isi arena yang penting
 * ditaruh di dalam kotak ini.
 */
export const HUD_SAFE = { x: 350, y: 80, width: 910, height: 500 } as const;

/** Arena aula (Level 1-3, T-089). */
export const HALL = {
  /** Jarak minimal antar titik robot di satu zona (piksel), supaya tidak bertumpuk. */
  minSpotGap: 60,
  zoneFill: 0x132238,
  zoneFillAlpha: 0.55,
  zoneStroke: 0x4b5b80,
  zoneStrokeWidth: 2,
  zoneTitleInset: 6,
  titleFontSize: '13px',
  counterInset: 28,
  counterFontSize: '15px',
  machineSize: 44,
  machineLabelGap: 4,
  machineStrokeWidth: 2,
  machineIdle: 0x2b364f,
  machineActive: 0x166534,
  machineStroke: 0x93a4c8,
  machineFontSize: '11px',
  doorLength: 76,
  doorThickness: 10,
  doorOpen: 0x14b8a6,
  doorClosed: 0xef4444,
  doorFree: 0x93a4c8,
  doorLabelGap: 8,
  doorLabelFontSize: '11px',
  overloadColor: 0xef4444,
  overloadStrokeWidth: 4,
  overloadFillAlpha: 0.12,
  overloadText: '#fecaca',
  bannerGap: 8,
  bannerFontSize: '22px',
  doorDropRadius: 90,
  dropReady: 0x14b8a6,
  dropOver: 0xffffff,
  dropReadyAlpha: 0.08,
  dropOverAlpha: 0.25,
  dropStrokeWidth: 3,
  dropText: '#99f6e4',
  robotStroke: 2,
  robotGlowStroke: 4,
  robotLabelFontSize: '10px',
  robotLabelGap: 4,
} as const;

// ---------------------------------------------------------------------------
// Meter baterai robot (BatteryMeter, T-045)
// ---------------------------------------------------------------------------

/**
 * Gaya meter baterai. Warna SELALU disertai label teks (persen atau HABIS),
 * sesuai aturan 8 CLAUDE.md. Ambang pita warna hanya urusan tampilan.
 */
export const BATTERY_STYLE = {
  width: 56,
  height: 16,
  frameStroke: 2,
  frameColor: 0xf9fafb,
  backColor: 0x111827,
  /** Tonjolan kutub di sisi kanan baterai. */
  tipWidth: 5,
  tipHeight: 8,
  /** Jarak antara baterai dan label teks di sebelah kanannya. */
  labelGap: 10,
  /** Sisa baterai (0..1) di atas ambang ini = pita penuh (hijau). */
  fullAbove: 0.5,
  /** Di atas ambang ini (dan di bawah fullAbove) = pita menipis (kuning). */
  lowAbove: 0.2,
  fullColor: 0x22c55e,
  lowColor: 0xf59e0b,
  emptyColor: 0xef4444,
} as const;

// ---------------------------------------------------------------------------
// Arena meja barang (Level 1-4, T-092)
// ---------------------------------------------------------------------------

/** Gaya meja, lampu sinyal, dan penanda tidur. Warna lampu selalu disertai label. */
export const TABLE = {
  tableFill: 0x2b364f,
  tableStroke: 0xf5c542,
  tableStrokeWidth: 3,
  tableTitleInset: 8,
  titleFontSize: '13px',
  countFontSize: '28px',
  lampRadius: 16,
  lampGreen: 0x22c55e,
  lampRed: 0xef4444,
  lampStrokeWidth: 3,
  lampStroke: 0xf9fafb,
  lampLabelGap: 10,
  lampLabelFontSize: '12px',
  /** Jarak zzz di atas titik pengepak. */
  zzzLift: 40,
  zzzFontSize: '18px',
  /** Jarak teks status pengepak di bawah pusat meter baterai. */
  modeGap: 24,
  modeFontSize: '12px',
} as const;
