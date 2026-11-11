export interface Point {
  x: number;
  y: number;
}

/** Persegi panjang dalam piksel kanvas; x dan y adalah sudut kiri atas. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Kotak luar jalan (piksel kanvas), termasuk lebar jalan. Lebar dan tinggi
 * harus kelipatan ROAD.unit dan minimal dua sudut (ROAD.corner x 2).
 */
export interface RoadRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Data jalur bersama untuk arena yang memakai checkpoint dan slot. */
export interface TrackLayout {
  /** Sama dengan LevelDefinition.layoutId. */
  id: string;
  road: RoadRect;
  checkpoints: number[];
  slots: number[];
  laneOffsets: number[];
  board: { x: number; y: number; width: number; height: number };
  boardLinks: { checkpoint: number; direction: 'read' | 'write' }[];
}

/**
 * Arena jenis loop (Level 1-1 sampai 1-2). Semua koordinat dalam piksel
 * kanvas (lihat ARENA di theme.ts); posisi di jalan berupa fraksi 0..1.
 */
export interface LoopLayout extends TrackLayout {
  kind: 'loop';
}

export interface CombinedLayout extends TrackLayout {
  kind: 'combined';
  tools: { mutexId: string; semaphoreId: string; conditionId: string };
  assembler: { threadId: string; zone: Rect };
  warehouse: { threadId: string; zone: Rect };
  area: {
    id: string;
    zone: Rect;
    gate: { start: number; end: number };
    door: Point;
    machines: Point[];
  };
  packer: {
    threadId: string;
    zone: Rect;
    lamp: Point;
    battery: Point;
  };
}

/**
 * Arena jenis aula (Level 1-3, T-089). Robot tidak berjalan di jalan; posisinya
 * ditentukan oleh zona tempat ia berada (lihat game/hallSpots.ts). Semua
 * koordinat dalam piksel kanvas.
 */
export interface HallLayout {
  kind: 'hall';
  /** Sama dengan LevelDefinition.layoutId. */
  id: string;
  /** Nama area berkapasitas di level (mis. 'aula'). */
  area: string;
  /**
   * Instruksi ASLI yang dilindungi gerbang kartu: `start` = ENTER_AREA dan
   * `end` = LEAVE_AREA (indeks program asli, inklusif).
   */
  gate: { start: number; end: number };
  /** Tempat robot mengerjakan WORK di luar aula. */
  workZone: Rect;
  /** Satu titik per robot (urut thread). */
  workSpots: Point[];
  /** Antrean di depan pintu aula. */
  queueZone: Rect;
  /** Titik antrean; indeks 0 paling dekat pintu. */
  queueSpots: Point[];
  hall: Rect;
  /** Pusat pintu aula, di tepi kiri `hall`. */
  door: Point;
  /** Posisi mesin; jumlahnya sama dengan kapasitas area. */
  machines: Point[];
  /** Tempat robot bila aula kelebihan kapasitas (bentrok). */
  overflowSpots: Point[];
  doneZone: Rect;
  /** Satu titik per robot (urut thread). */
  doneSpots: Point[];
  /** Pusat panel rak Kartu Akses. */
  tokenRack: Point;
}

/**
 * Arena jenis meja barang (Level 1-4, T-092): satu perakit, satu pengepak, dan
 * meja di antaranya. Robot diam di titiknya (tidak berjalan); yang berubah
 * adalah angka di meja, lampu sinyal, meter baterai, dan penanda tidur.
 * Semua koordinat dalam piksel kanvas.
 */
export interface DeskLayout {
  kind: 'desk';
  /** Sama dengan LevelDefinition.layoutId. */
  id: string;
  /** Id thread perakit (pengisi meja) pada level. */
  assemblerId: string;
  /** Id thread pengepak (penunggu) pada level. */
  packerId: string;
  workZone: Rect;
  /** Meja barang: angka variabel target ditampilkan di sini. */
  table: Rect;
  packZone: Rect;
  assemblerSpot: Point;
  packerSpot: Point;
  /** Pusat lampu sinyal, di atas meja. */
  lamp: Point;
  /** Pusat badan meter baterai pengepak. */
  battery: Point;
}
/**
 * Arena jenis ban berjalan (Level 2-1, T-096): perakit (producer) di kiri,
 * pengepak (consumer) di kanan, ban di tengah. Robot diam di titiknya; yang
 * berubah adalah isi ban (BufferView). Semua koordinat dalam piksel kanvas
 * dan berada di dalam HUD_SAFE (theme.ts).
 */
export interface BeltLayout {
  kind: 'belt';
  /** Sama dengan LevelDefinition.layoutId. */
  id: string;
  /** Id ban di EngineConfig.buffers. */
  bufferId: string;
  belt: Rect;
  producerZone: Rect;
  consumerZone: Rect;
  /** Id thread perakit, sejajar dengan `producerSpots`. */
  producerIds: string[];
  producerSpots: Point[];
  /** Id thread pengepak, sejajar dengan `consumerSpots`. */
  consumerIds: string[];
  consumerSpots: Point[];
}

/**
 * Arena jenis meja bundar (Level 2-3, T-058): 5 teknisi dan 5 kunci inggris.
 * Teknisi diam di titiknya mengelilingi meja bundar; kunci ditampilkan sebagai
 * objek di antara teknisi. Garis merah siklus tunggu dan empat kotak kondisi
 * Coffman ditampilkan saat deadlock terdeteksi. Tombol "Rampas kunci" muncul
 * saat deadlock untuk memulihkan simulasi. Semua koordinat dalam piksel kanvas.
 */
export interface TableLayout {
  kind: 'table';
  /** Sama dengan LevelDefinition.layoutId. */
  id: string;
  /** Pusat meja bundar. */
  center: Point;
  /** Jari-jari lingkaran tempat teknisi duduk. */
  radius: number;
  /** Id thread teknisi (urut T1..T5). */
  technicianIds: string[];
  /** Id mutex kunci inggris (urut fork0..fork4). */
  forkIds: string[];
  /** Area untuk empat kotak kondisi Coffman (kanan bawah). */
  coffmanZone: Rect;
  /** Posisi tombol "Rampas kunci" (tengah bawah). */
  preemptButton: Point;
}

export type ArenaLayout =
  | LoopLayout
  | HallLayout
  | DeskLayout
  | CombinedLayout
  | BeltLayout
  | TableLayout;
