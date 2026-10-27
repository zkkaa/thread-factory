export interface Point {
  x: number;
  y: number;
}

/**
 * Arena jenis loop (Level 1-1 sampai 1-4). Semua koordinat dalam piksel
 * kanvas (lihat ARENA di theme.ts); posisi di jalan berupa fraksi 0..1.
 */
export interface LoopLayout {
  kind: 'loop';
  /** Sama dengan LevelDefinition.layoutId. */
  id: string;
  /** Titik kontrol jalan melengkung (satu putaran), searah gerak. */
  path: Point[];
  /** Posisi tiap checkpoint (fraksi panjang jalan), urut program asli. */
  checkpoints: number[];
  /** n+1 posisi slot (fraksi); slot k berada sebelum checkpoint k. */
  slots: number[];
  /** Jarak tegak lurus jalan (piksel) untuk tiap robot: jalur sejajar. */
  laneOffsets: number[];
  board: { x: number; y: number; width: number; height: number };
  boardLinks: { checkpoint: number; direction: 'read' | 'write' }[];
}

// HallLayout, BeltLayout, TableLayout ditambahkan saat levelnya dikerjakan.
export type ArenaLayout = LoopLayout;
