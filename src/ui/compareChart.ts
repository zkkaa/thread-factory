/**
 * Logika murni grafik batang perbandingan (T-066). Dipisah dari komponen
 * supaya bisa dites di Vitest tanpa browser.
 */

export interface BarFractions {
  /** Panjang batang A, 0..1 terhadap nilai terbesar pada baris yang sama. */
  a: number;
  /** Panjang batang B, 0..1. */
  b: number;
}

/** Batang bernilai positif minimal setinggi ini, agar tetap terlihat. */
const MIN_VISIBLE = 0.02;

function clean(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * Panjang batang A dan B untuk satu metrik. Skala dihitung per baris (tiap
 * metrik beda satuan), batang terpanjang = 1. Nilai nol, negatif, atau tidak
 * valid menghasilkan batang kosong.
 */
export function barFractions(a: number, b: number): BarFractions {
  const cleanA = clean(a);
  const cleanB = clean(b);
  const max = Math.max(cleanA, cleanB);
  if (max === 0) return { a: 0, b: 0 };
  const scale = (value: number): number =>
    value === 0 ? 0 : Math.max(MIN_VISIBLE, value / max);
  return { a: scale(cleanA), b: scale(cleanB) };
}

/** Warna batang grafik. Warna selalu disertai huruf A/B. */
export const CHART = {
  colorA: '#f5c542',
  colorB: '#2dd4bf',
} as const;
