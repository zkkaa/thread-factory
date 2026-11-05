import { BATTERY_STYLE } from './theme';

export type BatteryBand = 'full' | 'low' | 'empty';

export interface BatteryLook {
  /** Sisa baterai yang sudah dibatasi 0..1. */
  fraction: number;
  /** Persen bulat 0..100. */
  percent: number;
  /** Pita warna: penuh, menipis, atau habis. */
  band: BatteryBand;
  /** Warna isi baterai. */
  color: number;
  /** Teks di samping baterai; warna tidak pernah berdiri sendiri. */
  label: string;
}

/**
 * Mengubah sisa baterai (0..1, dihitung `batteryLevel` di engine) menjadi
 * tampilan: persen, pita warna, dan label. Murni dan tanpa Phaser supaya bisa
 * dites; tidak ada aturan permainan di sini, hanya cara menggambar angka.
 */
export function deriveBatteryLook(level: number): BatteryLook {
  const fraction = Number.isFinite(level) ? Math.min(1, Math.max(0, level)) : 0;
  const percent = Math.round(fraction * 100);

  let band: BatteryBand;
  let color: number;
  if (percent === 0) {
    band = 'empty';
    color = BATTERY_STYLE.emptyColor;
  } else if (fraction > BATTERY_STYLE.fullAbove) {
    band = 'full';
    color = BATTERY_STYLE.fullColor;
  } else if (fraction > BATTERY_STYLE.lowAbove) {
    band = 'low';
    color = BATTERY_STYLE.lowColor;
  } else {
    band = 'empty';
    color = BATTERY_STYLE.emptyColor;
  }

  return {
    fraction,
    percent,
    band,
    color,
    label: percent === 0 ? 'HABIS' : `${percent}%`,
  };
}
