import type { CompareSummary } from '../../../controller/compareMetrics';
import { barFractions, CHART } from '../../compareChart';
import { formatNumber } from '../../comparePanel';

interface CompareBarChartProps {
  summary: CompareSummary;
}

/**
 * Grafik batang buatan sendiri: satu pasang batang (A dan B) per metrik.
 * Pemenang ditulis dengan teks "lebih baik" dan tiap batang diberi huruf A/B,
 * jadi tidak bergantung pada warna. Angka lengkap tetap ada di tabel.
 */
export function CompareBarChart({ summary }: CompareBarChartProps) {
  const { rows } = summary;
  if (rows.length === 0) return null;

  const bars = [
    { side: 'A' as const, color: CHART.colorA },
    { side: 'B' as const, color: CHART.colorB },
  ];

  return (
    <figure className="space-y-2">
      <div
        role="img"
        aria-label={`Grafik batang perbandingan A dan B untuk ${rows.length} metrik. Angka lengkap ada di tabel.`}
        className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        {rows.map((row) => {
          const fractions = barFractions(row.a, row.b);
          return (
            <div key={row.key} data-metric={row.key} className="space-y-2">
              <h3 className="font-semibold leading-tight text-ink-100">
                {row.label}
              </h3>
              <div className="space-y-1.5">
                {bars.map(({ side, color }) => {
                  const value = side === 'A' ? row.a : row.b;
                  const fraction = side === 'A' ? fractions.a : fractions.b;
                  const winner = row.better === side;
                  return (
                    <div
                      key={side}
                      className="grid grid-cols-[1.25rem_minmax(0,1fr)_minmax(0,30%)] items-center gap-x-2"
                    >
                      <span className="text-ink-300">{side}</span>
                      <div className="h-4 min-w-0 overflow-hidden rounded-full bg-navy-700">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${fraction * 100}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                      <span
                        className={`min-w-0 break-words text-sm leading-tight ${
                          winner ? 'font-bold text-ink-100' : 'text-ink-300'
                        }`}
                      >
                        {formatNumber(value)}
                        {winner ? ' (lebih baik)' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <figcaption className="text-xs text-ink-300">
        Panjang batang dibandingkan per metrik (batang terpanjang = penuh).
        {summary.complete
          ? ''
          : ' Angka masih sementara sampai kedua sisi selesai.'}
      </figcaption>
    </figure>
  );
}
