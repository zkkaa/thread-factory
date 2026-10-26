/** Pemicu "lanjut" yang hanya boleh menyala sekali, baik oleh timer maupun skip. */
export interface AutoAdvance {
  /** Langsung lanjut sekarang (mengabaikan sisa waktu). */
  skip: () => void;
  /** Membatalkan tanpa memanggil onAdvance (mis. layar ditinggalkan). */
  cancel: () => void;
}

/**
 * Menjadwalkan `onAdvance` setelah `delayMs`. Setelah menyala atau dibatalkan,
 * pemanggilan berikutnya diabaikan, sehingga ketukan layar dan tombol Lewati
 * yang terjadi bersamaan tidak memindahkan layar dua kali.
 */
export function createAutoAdvance(
  onAdvance: () => void,
  delayMs: number,
): AutoAdvance {
  let finished = false;
  const handle: ReturnType<typeof setTimeout> = setTimeout(fire, delayMs);

  function fire(): void {
    if (finished) return;
    finished = true;
    clearTimeout(handle);
    onAdvance();
  }

  return {
    skip: fire,
    cancel: () => {
      finished = true;
      clearTimeout(handle);
    },
  };
}
