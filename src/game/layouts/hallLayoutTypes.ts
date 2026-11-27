import type { Point } from './types';

/** Satu lajur masuk (konveyor) menuju gerbang. */
export interface HallLane {
  /** Sumbu y lajur (piksel kanvas). */
  y: number;
  /** Titik belok kanan lajur, sesudah gerbang, sebelum lajur bergabung. */
  turn: Point;
  /** Tempat antre di lajur ini; indeks 0 paling dekat gerbang. */
  queueSpots: Point[];
  /** Urutan robot (indeks thread) yang memakai lajur ini. */
  robots: number[];
}

/** Penempatan sprite statis di atas background (kiri atas, skala dari berkas yang sudah dipangkas). */
export interface ArtPlacement {
  x: number;
  y: number;
  scale: number;
}

/**
 * Arena aula (Level 1-3): dua lajur masuk sejajar dengan satu gerbang yang
 * membentang di keduanya, lalu menyatu ke satu Area Kerja dan pintu keluar.
 * Tidak ada jalur kembali: robot yang keluar memudar lalu muncul lagi di
 * pijakannya sendiri. Semua angka dalam piksel kanvas 1280x720 dan HANYA
 * boleh ada di berkas layout, bukan di scene atau view.
 */
export interface HallLayout {
  kind: 'hall';
  /** Sama dengan LevelDefinition.layoutId. */
  id: string;
  /** n+1 titik slot pemasangan pintu (program n instruksi), urut slot. */
  slots: Point[];
  /** Satu pijakan per robot; juga tempat robot yang sudah selesai berdiam. */
  prepSpots: Point[];
  /** Sumbu x sumbu tegak tempat pijakan menyambung ke lajur. */
  spineX: number;
  lanes: HallLane[];
  /** Pusat gerbang; robot melewatinya pada y lajurnya. */
  gate: Point;
  /** Titik tempat dua lajur bertemu menuju Area Kerja. */
  merge: Point;
  /** Tempat berdiri di Area Kerja; tiga pertama (sebanyak kapasitas) = mesin. */
  areaSpots: Point[];
  areaBox: { x: number; y: number; width: number; height: number };
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