/**
 * Logika murni nomor halaman dialog (tanpa React) supaya bisa dites.
 * `index` yang di luar jangkauan dirapikan ke halaman pertama atau terakhir.
 */
export function pageInfo(index: number, total: number) {
  const count = Math.max(total, 1);
  const last = count - 1;
  const current = Math.min(Math.max(index, 0), last);
  return {
    index: current,
    isLast: current >= last,
    label: `Halaman ${current + 1} / ${count}`,
  };
}
