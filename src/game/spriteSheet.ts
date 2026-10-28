/** Deskripsi satu spritesheet berisi frame seragam tanpa jarak antar-frame. */
export interface SheetSpec {
  /** Kunci tekstur akhir (sudah diskalakan) yang dipakai view. */
  key: string;
  /** Kunci tekstur sementara hasil muat berkas asli. */
  sourceKey: string;
  /** Jalur berkas relatif terhadap public/assets. */
  path: string;
  /** Sisi satu frame pada berkas asli (piksel). */
  frameSize: number;
  columns: number;
  rows: number;
  /** Pembesaran bulat (nearest-neighbor) saat membuat tekstur akhir. */
  scale: number;
}

export interface FrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function frameCount(spec: SheetSpec): number {
  return spec.columns * spec.rows;
}

/** Sisi satu frame pada tekstur yang sudah diskalakan. */
export function scaledFrameSize(spec: SheetSpec): number {
  return spec.frameSize * spec.scale;
}

/**
 * Persegi frame ke-`index` (dihitung baris demi baris) pada tekstur yang
 * SUDAH diskalakan. Nomornya sama dengan peta di docs/tiny-factory-frames.png.
 */
export function frameRect(spec: SheetSpec, index: number): FrameRect {
  if (!Number.isInteger(index) || index < 0 || index >= frameCount(spec)) {
    throw new RangeError(
      `Frame ${index} di luar rentang 0..${frameCount(spec) - 1}.`,
    );
  }
  const size = scaledFrameSize(spec);
  return {
    x: (index % spec.columns) * size,
    y: Math.floor(index / spec.columns) * size,
    width: size,
    height: size,
  };
}
