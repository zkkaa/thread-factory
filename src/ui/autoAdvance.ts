/** Pemicu "lanjut" yang hanya boleh menyala sekali, baik oleh timer maupun skip. */
export interface AutoAdvance {
  /** Langsung lanjut sekarang (mengabaikan sisa waktu). */
  skip: () => void;
  /** Membatalkan tanpa memanggil onAdvance (mis. layar ditinggalkan). */
  cancel: () => void;
  /** Menghentikan hitungan mundur sementara; sisa waktu disimpan. */
  pause: () => void;
  /** Melanjutkan hitungan dari sisa waktu. Tidak berefek bila tidak sedang dijeda. */
  resume: () => void;
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
  let remaining = delayMs;
  let startedAt = Date.now();
  let handle: ReturnType<typeof setTimeout> | null = setTimeout(fire, delayMs);

  function clear(): void {
    if (handle !== null) {
      clearTimeout(handle);
      handle = null;
    }
  }

  function fire(): void {
    if (finished) return;
    finished = true;
    clear();
    onAdvance();
  }

  return {
    skip: fire,
    cancel: () => {
      finished = true;
      clear();
    },
    pause: () => {
      if (finished || handle === null) return;
      remaining = Math.max(0, remaining - (Date.now() - startedAt));
      clear();
    },
    resume: () => {
      if (finished || handle !== null) return;
      startedAt = Date.now();
      handle = setTimeout(fire, remaining);
    },
  };
}
