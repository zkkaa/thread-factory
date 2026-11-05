import { batteryLevel } from '../engine/metrics';
import type { Snapshot } from '../engine/types';

/** Keadaan pengepak yang perlu ditampilkan; semuanya diturunkan dari snapshot. */
export type PackerMode =
  'sleeping' | 'spinning' | 'waiting' | 'working' | 'done';

export interface TableState {
  /** Nilai variabel target di meja (mis. jumlah barang). */
  items: number;
  target: number;
  /** Lampu hijau bila barang sudah cukup. */
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
  working: 'Siap bekerja',
  done: 'Selesai',
};

/**
 * Menurunkan tampilan meja dari snapshot. Fungsi murni tanpa Phaser. Tidak ada
 * aturan permainan di sini: baterai dihitung `batteryLevel` dari engine, dan
 * mode hanya membaca state thread. Catatan: mode 'spinning' baru terbaca
 * setelah ada tick pengecekan yang gagal (busyWaitTicks > 0).
 */
export function deriveTableState(
  snapshot: Readonly<Snapshot>,
  packerId: string,
  variable: string,
  target: number,
): TableState {
  const packer = snapshot.threads.find((thread) => thread.id === packerId);
  if (packer === undefined) {
    throw new Error(`Pengepak "${packerId}" tidak ada di snapshot.`);
  }
  const items = snapshot.sharedVars[variable] ?? 0;

  let packerMode: PackerMode = 'working';
  if (packer.state === 'TERMINATED') {
    packerMode = 'done';
  } else if (packer.state === 'WAITING') {
    packerMode = packer.waitingOn?.startsWith('cond:') ? 'sleeping' : 'waiting';
  } else if (items < target && packer.busyWaitTicks > 0) {
    packerMode = 'spinning';
  }

  const lampGreen = items >= target;
  return {
    items,
    target,
    lampGreen,
    lampLabel: lampGreen
      ? 'LAMPU HIJAU (barang cukup)'
      : 'LAMPU MERAH (barang belum cukup)',
    packerMode,
    modeLabel: MODE_LABEL[packerMode],
    battery: batteryLevel(packer.busyWaitTicks),
  };
}
