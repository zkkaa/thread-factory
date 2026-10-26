import type { Clock } from '../clock';

/** Jam palsu: waktu hanya maju saat tes memanggil advance(). */
export class ManualClock implements Clock {
  private nextHandle = 1;
  private readonly pending = new Map<number, (time: number) => void>();
  private time = 0;

  requestFrame(callback: (time: number) => void): number {
    const handle = this.nextHandle++;
    this.pending.set(handle, callback);
    return handle;
  }

  cancelFrame(handle: number): void {
    this.pending.delete(handle);
  }

  get pendingCount(): number {
    return this.pending.size;
  }

  /** Majukan waktu `ms` milidetik lalu jalankan satu frame. */
  advance(ms: number): void {
    this.time += ms;
    const callbacks = [...this.pending.values()];
    this.pending.clear();
    for (const callback of callbacks) callback(this.time);
  }
}
