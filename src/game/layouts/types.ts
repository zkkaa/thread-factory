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

/** Satu lajur masuk (konveyor) menuju gerbang pada arena aula dua lajur. */
export interface LaneHallLane {
  /** Sumbu y lajur (piksel kanvas). */
  y: number;
  /** Titik belok kanan lajur, sesudah gerbang, sebelum lajur bergabung. */
  turn: Point;
  /** Tempat antre di lajur ini; indeks 0 paling dekat gerbang. */
  queueSpots: Point[];
  /** Urutan robot (indeks thread) yang memakai lajur ini. */
  robots: number[];
}

/** Penempatan sprite statis di atas background (kiri atas; skala dari berkas yang sudah dipangkas). */
export interface ArtPlacement {
  x: number;
  y: number;
  scale: number;
}

/**
 * Arena aula dua lajur (Level 1-3 versi background gambar): dua lajur masuk
 * sejajar dengan satu gerbang yang membentang di keduanya, lalu menyatu ke
 * satu Area Kerja dan pintu keluar. Tidak ada jalur kembali: robot yang keluar
 * memudar lalu muncul lagi di pijakannya sendiri. Jalan, lantai, dan bingkai
 * adalah bagian background; kolom pijakan dan gerbang adalah sprite terpisah
 * (`art`). Semua angka dalam piksel kanvas dan hanya boleh ada di berkas
 * layout, bukan di scene atau view. Logikanya ada di game/laneHallStages.ts.
 */
export interface LaneHallLayout {
  kind: 'laneHall';
  /** Sama dengan LevelDefinition.layoutId. */
  id: string;
  /** n+1 titik slot pemasangan pintu (program n instruksi), urut slot. */
  slots: Point[];
  /** Satu pijakan per robot; juga tempat robot yang sudah selesai berdiam. */
  prepSpots: Point[];
  /** Sumbu x sumbu tegak tempat pijakan menyambung ke lajur. */
  spineX: number;
  lanes: LaneHallLane[];
  /** Pusat gerbang; robot melewatinya pada y lajurnya. */
  gate: Point;
  /** Titik tempat dua lajur bertemu menuju Area Kerja. */
  merge: Point;
  /** Tempat berdiri di Area Kerja; tiga pertama (sebanyak kapasitas) = mesin. */
  areaSpots: Point[];
  areaBox: Rect;
  /** Tempat robot berdiri sesudah LEAVE_AREA, di depan panel EXIT. */
  exitSpot: Point;
  art: {
    column: ArtPlacement;
    gate: ArtPlacement & {
      /** Titik tiga lampu (kartu tersedia) dan jari-jarinya, koordinat kanvas. */
      lamps: Point[];
      lampRadius: number;
    };
  };
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

/** Satu lajur robot pada arena lini lurus. */
export interface LineLane {
  threadId: string;
  /** Garis tengah lajur (piksel kanvas). */
  y: number;
  /** Kartu nama dan status satu baris di kiri lajur. */
  label: Rect;
}

/**
 * Arena lini lurus (Level 1-5 versi tiga lajur, T-094): tiap robot punya lajur
 * sendiri, semua lajur berbagi posisi x checkpoint dan slot (program ketiganya
 * sama panjang). Gerbang alat berupa batang tegak yang memotong semua lajur di
 * `slotX[k]`.
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

/**
 * Arena alur A sampai E (Level 1-5): kerja -> aula (semaphore) -> papan stok
 * (mutex) -> Pengepak (condition variable) -> selesai. Robot tidak berjalan
 * di jalan; posisinya ditentukan zona (lihat game/flowSpots.ts). Semua
 * koordinat dalam piksel kanvas dan berada di dalam HUD_SAFE (theme.ts).
 */
export interface FlowLayout {
  kind: 'flow';
  /** Sama dengan LevelDefinition.layoutId. */
  id: string;
  /** Nama area berkapasitas di level (mis. 'aula'). */
  area: string;
  /** Id thread Pengepak; thread lain dianggap perakit. */
  packerId: string;
  /** Id resource yang dipakai alur ini. */
  tools: { mutexId: string; semaphoreId: string; conditionId: string };
  /** Indeks instruksi ASLI perakit: ENTER_AREA sampai LEAVE_AREA, inklusif. */
  hallSpan: { start: number; end: number };
  /** Indeks instruksi ASLI perakit: READ sampai WRITE, inklusif. */
  stockSpan: { start: number; end: number };

  /** Zona A: tempat robot merakit. */
  workZone: Rect;
  /** Satu titik per perakit (urut thread). */
  workSpots: Point[];

  /** Zona B: aula mesin berkapasitas. */
  hallZone: Rect;
  /** Antrean kartu; indeks 0 paling dekat pintu. */
  hallQueueSpots: Point[];
  /** Pusat pintu aula, di dalam `hallZone`. */
  hallDoor: Point;
  /** Posisi mesin; jumlahnya sama dengan kapasitas area. */
  machines: Point[];
  /** Tempat robot bila aula kelebihan kapasitas (bentrok). */
  overflowSpots: Point[];

  /** Zona C: papan stok yang dijaga mutex. */
  stockZone: Rect;
  /** Papan stok di bagian atas zona C. */
  stockBoard: Rect;
  /** Antrean pintu mutex; indeks 0 paling dekat gerbang. */
  stockQueueSpots: Point[];
  /** Pusat gerbang mutex, di dalam `stockZone`. */
  stockDoor: Point;
  /** Titik robot yang sudah melewati gerbang (area kritis). */
  stockSpots: Point[];

  /** Zona D: Pengepak, lampu sinyal, dan baterai. */
  packZone: Rect;
  packerSpot: Point;
  lamp: Point;
  battery: Point;

  /** Zona E: robot yang sudah selesai. */
  doneZone: Rect;
  /** Satu titik per perakit (urut thread). */
  doneSpots: Point[];
}

export type ArenaLayout =
  | LoopLayout
  | HallLayout
  | LaneHallLayout
  | DeskLayout
  | CombinedLayout
  | LineLayout
  | FlowLayout
  | BeltLayout
  | TableLayout
  | BoardLayout
  | TripleLayout;