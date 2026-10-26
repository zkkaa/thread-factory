/**
 * Abstraksi "jam frame". Controller tidak memanggil requestAnimationFrame
 * langsung supaya bisa dites di Vitest (environment node) memakai jam palsu.
 */
export interface Clock {
  /** Minta callback dipanggil pada frame berikutnya; `time` dalam milidetik. */
  requestFrame(callback: (time: number) => void): number;
  cancelFrame(handle: number): void;
}

/** Jam sungguhan untuk browser. Pemanggilan ditunda sampai dipakai, jadi aman diimpor di node. */
export const browserClock: Clock = {
  requestFrame: (callback) => globalThis.requestAnimationFrame(callback),
  cancelFrame: (handle) => globalThis.cancelAnimationFrame(handle),
};
