export type PatienceLevel = 'ok' | 'warn' | 'bad';

export interface PatienceView {
  /** 0..1, bagian bar yang terisi. */
  fraction: number;
  level: PatienceLevel;
  label: string;
}

/** Mulai oranye saat sudah menunggu sekian bagian dari ambang starvation. */
export const PATIENCE_WARN_AT = 0.7;

/**
 * Data tampilan bar kesabaran satu penulis (fungsi murni). Ambang diambil
 * dari snapshot; di sini tidak ada aturan menang atau kalah, hanya
 * menerjemahkan lama menunggu menjadi bar.
 */
export function patienceView(
  name: string,
  streak: number,
  limit: number,
): PatienceView {
  const fraction = limit <= 0 ? 1 : Math.min(1, Math.max(0, streak / limit));
  let level: PatienceLevel = 'ok';
  if (streak >= limit) level = 'bad';
  else if (fraction >= PATIENCE_WARN_AT) level = 'warn';
  const suffix = level === 'bad' ? ' KELAPARAN' : '';
  return { fraction, level, label: `${name}: ${streak}/${limit}${suffix}` };
}
