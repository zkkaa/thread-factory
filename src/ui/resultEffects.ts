/**
 * Aturan efek popup hasil (S6) dan data keping konfeti. Murni dan
 * deterministik (tanpa Math.random) supaya bisa dites tanpa browser.
 * Semua efek mati saat "kurangi animasi" (CLAUDE.md aturan 11).
 */

export interface ResultEffects {
  /** Konfeti jatuh di seluruh layar (menang). */
  confetti: boolean;
  /** Kilau di sekitar bintang (menang). */
  sparkles: boolean;
  /** Pita judul bergetar sekali (kalah). */
  shake: boolean;
  /** Tepi layar kemerahan tipis (kalah). */
  vignette: boolean;
}

export function resultEffects(
  ok: boolean,
  reduceMotion: boolean,
): ResultEffects {
  const on = !reduceMotion;
  return {
    confetti: on && ok,
    sparkles: on && ok,
    shake: on && !ok,
    vignette: on && !ok,
  };
}

export interface ConfettiPiece {
  id: number;
  /** Posisi horizontal dalam persen lebar layar. */
  left: number;
  /** Detik. */
  delay: number;
  duration: number;
  color: string;
  /** Lebar dalam piksel; tingginya 1,6 kali lebar. */
  size: number;
}

const COLORS = ['#ffc93c', '#ff8a3d', '#34d399', '#60a5fa', '#f472b6'];

/** Keping konfeti dengan sebaran tetap (pola bilangan, bukan acak). */
export function confettiPieces(count = 24): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: ((i * 37) % 97) + 1,
    delay: (i % 8) * 0.1,
    duration: 1.6 + (i % 5) * 0.25,
    color: COLORS[i % COLORS.length] ?? '#ffc93c',
    size: 6 + (i % 3) * 3,
  }));
}
