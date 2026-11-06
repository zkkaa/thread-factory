import { batteryLevel } from '../engine/metrics';
import type { SimEvent, Snapshot } from '../engine/types';

/** Keadaan pengepak yang perlu ditampilkan; semuanya diturunkan dari snapshot. */
export type PackerMode =
  | 'sleeping'
  | 'spinning'
  | 'waiting'
  | 'preparing'
  | 'working'
  | 'done';

export interface DeskState {
  /** Nilai variabel target di meja (mis. jumlah barang). */
  items: number;
  target: number;
  /** Hijau bila Perakit sudah mengirim sinyal (COND_SIGNAL), bukan karena barang cukup. */
  lampGreen: boolean;
  lampLabel: string;
  packerMode: PackerMode;
  modeLabel: string;
  /** Sisa baterai pengepak, 0..1. */
  battery: number;
}

const MODE_LABEL: Record<PackerMode, string> = {
  sleeping: 'Tidur (hemat baterai)',
  spinning: 'Mengecek terus (busy waiting)',
  waiting: 'Menunggu kunci meja',
  preparing: 'Bersiap',
  working: 'Bekerja (mengepak)',
  done: 'Selesai',
};

/** True bila di antara `events` ada eksekusi COND_SIGNAL (lampu dinyalakan). */
export function sawSignal(events: readonly SimEvent[]): boolean {
  return events.some(
    (event) => event.type === 'INSTRUCTION' && event.op === 'COND_SIGNAL',
  );
}

/**
 * Menurunkan tampilan meja dari snapshot. Fungsi murni tanpa Phaser. Tidak ada
 * aturan permainan di sini: baterai dihitung `batteryLevel` dari engine, mode
 * hanya membaca state thread, dan `signaled` (sinyal sudah dikirim) diberikan
 * pemanggil karena snapshot tidak menyimpannya. Mode 'spinning' baru terbaca
 * setelah ada tick pengecekan yang gagal (busyWaitTicks > 0).
 */
export function deriveDeskState(
  snapshot: Readonly<Snapshot>,
  packerId: string,
  variable: string,
  target: number,
  signaled: boolean,
): DeskState {
  const packer = snapshot.threads.find((thread) => thread.id === packerId);
  if (packer === undefined) {
    throw new Error(`Pengepak "${packerId}" tidak ada di snapshot.`);
  }
  const items = snapshot.sharedVars[variable] ?? 0;
  let packerMode: PackerMode;
  if (packer.state === 'TERMINATED') {
    packerMode = 'done';
  } else if (packer.state === 'WAITING') {
    packerMode = packer.waitingOn?.startsWith('cond:') ? 'sleeping' : 'waiting';
  } else if (items < target && packer.busyWaitTicks > 0) {
    packerMode = 'spinning';
  } else if (items >= target || signaled) {
    packerMode = 'working';
  } else {
    packerMode = 'preparing';
  }
  return {
    items,
    target,
    lampGreen: signaled,
    lampLabel: signaled
      ? 'LAMPU HIJAU (sinyal dikirim)'
      : 'LAMPU MERAH (belum ada sinyal)',
    packerMode,
    modeLabel: MODE_LABEL[packerMode],
    battery: batteryLevel(packer.busyWaitTicks),
  };
}