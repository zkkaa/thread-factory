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
  warehouse: { threadId: string; zone: Rect; doorPanel: Rect };
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
// BeltLayout dan BoardLayout ditambahkan saat levelnya dikerjakan.
/**
 * Arena jenis meja bundar (Level 2-3, T-101): teknisi duduk melingkar dan
 * satu kunci inggris di antara tiap dua teknisi. Tidak ada jalan atau
 * checkpoint; posisi tetap. Koordinat dalam piksel kanvas, di dalam HUD_SAFE.
 */
export interface TableLayout {
  kind: 'table';
  /** Sama dengan LevelDefinition.layoutId. */
  id: string;
  /** Lingkaran meja (hanya hiasan). */
  table: { center: Point; radius: number };
  /** Id thread teknisi, sejajar dengan `seats`. */
  seatIds: string[];
  seats: Point[];
  /** Id mutex kunci, sejajar dengan `forks`; kunci ke-i di antara teknisi i dan i+1. */
  forkIds: string[];
  forks: Point[];
  /** Pojok kiri atas panel empat kondisi Coffman. Kosong = panel tidak digambar. */
  coffmanPanel?: Point;
}

/**
 * Arena jenis papan pengumuman (Level 2-2, T-099): barisan pembaca di kiri,
 * penulis di kanan, papan di tengah. Robot diam di titiknya; yang berubah
 * adalah angka papan, status kunci, dan peringatan. Koordinat di dalam HUD_SAFE.
 */
export interface BoardLayout {
  kind: 'board';
  /** Sama dengan LevelDefinition.layoutId. */
  id: string;
  /** Id papan di resource level. */
  boardId: string;
  board: Rect;
  readerZone: Rect;
  writerZone: Rect;
  readerIds: string[];
  readerSpots: Point[];
  writerIds: string[];
  writerSpots: Point[];
}

/** Level 2-4: tiga arena komponen dalam satu kanvas, tiap layout berdiri sendiri. */
export interface TripleLayout {
  kind: 'triple';
  id: string;
  belt: BeltLayout;
  board: BoardLayout;
  table: TableLayout;
}

export type ArenaLayout =
  | LoopLayout
  | HallLayout
  | DeskLayout
  | CombinedLayout
  | LineLayout
  | BeltLayout
  | TableLayout
  | BoardLayout
  | TripleLayout;

  /** Satu lajur robot pada arena lini lurus. */
export interface LineLane {
  threadId: string;
  /** Garis tengah lajur (piksel kanvas). */
  y: number;
  /** Kartu nama dan status satu baris di kiri lajur. */
  label: Rect;
}

/**
 * Arena lini lurus (Level 1-5, T-094): tiap robot punya lajur sendiri, semua
 * lajur berbagi posisi x checkpoint dan slot (program ketiganya sama panjang).
 * Gerbang alat berupa batang tegak yang memotong semua lajur di `slotX[k]`.
 * Belum masuk union ArenaLayout; didaftarkan setelah LineArena ada.
 */
export interface LineLayout {
  kind: 'line';
  /** Sama dengan LevelDefinition.layoutId. */
  id: string;
  tools: { mutexId: string; semaphoreId: string; conditionId: string };
  lanes: LineLane[];
  /** x tiap checkpoint (n), urut program asli. */
  checkpointX: number[];
  /** x tiap slot (n+1); slot k tepat sebelum checkpoint k. */
  slotX: number[];
  hall: {
    id: string;
    zone: Rect;
    /** Indeks instruksi ASLI ENTER_AREA dan LEAVE_AREA (inklusif). */
    gate: { start: number; end: number };
  };
  board: Rect;
  boardLinks: { checkpoint: number; direction: 'read' | 'write' }[];
  storage: Rect;
  packer: { threadId: string; card: Rect; lamp: Point; battery: Point };
  mutexPanel: Rect;
  areaPanel: Rect;
}