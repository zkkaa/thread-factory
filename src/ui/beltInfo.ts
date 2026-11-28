import type { LevelDefinition } from '../levels/types';

/**
 * Total barang yang diambil dari ban selama level, dihitung dari program
 * (jumlah TAKE_ITEM dikali repeat). Null bila level tanpa ban atau tanpa
 * pengambilan. Hanya untuk teks tampilan; penilaian tetap di `evaluateLevel`.
 */
export function totalTakenItems(level: LevelDefinition): number | null {
  if (level.buffers === undefined || Object.keys(level.buffers).length === 0) {
    return null;
  }
  const total = level.threads.reduce((sum, thread) => {
    const takes = thread.program.filter((ins) => ins.op === 'TAKE_ITEM').length;
    return sum + takes * (thread.repeat ?? 1);
  }, 0);
  return total > 0 ? total : null;
}