import type { Instruction } from '../engine/types';

export interface OpInfo {
  /** Teks pendek di dalam checkpoint. */
  short: string;
  /** Penjelasan awam untuk tooltip. */
  description: string;
}

/** Teks checkpoint dan tooltip tiap instruksi (PRD 17.3). */
export function describeOp(instruction: Instruction): OpInfo {
  switch (instruction.op) {
    case 'WORK':
      return {
        short: 'WORK',
        description:
          'Merakit produk. Pekerjaan lokal robot, tidak menyentuh papan stok.',
      };
    case 'READ':
      return {
        short: 'READ',
        description: `Membaca angka "${instruction.from}" dari papan ke catatan robot.`,
      };
    case 'COMPUTE':
      return {
        short: 'COMPUTE',
        description: `Menambah ${instruction.add} pada angka di catatan robot. Papan belum berubah.`,
      };
    case 'WRITE':
      return {
        short: 'WRITE',
        description: `Menulis angka di catatan robot ke papan "${instruction.to}", menimpa nilai yang ada di sana.`,
      };
    default:
      return {
        short: instruction.op,
        description: `Instruksi ${instruction.op}.`,
      };
  }
}
