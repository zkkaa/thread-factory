import type { CompareSummary } from '../../../controller/compareMetrics';
import { barFractions, CHART } from '../../compareChart';
import { formatNumber } from '../../comparePanel';

interface CompareBarChartProps {
  summary: CompareSummary;
}

/**
 * Grafik batang SVG buatan sendiri: satu pasang batang (A dan B) per metrik.
 * Pemenang ditulis dengan teks "lebih baik" dan tiap batang diberi huruf A/B,
 * jadi tidak bergantung pada warna. Angka lengkap tetap ada di tabel.
 */
export function CompareBarChart({ summary }: CompareBarChartProps) {
  const { rows } = summary;
  if (rows.length === 0) return null;

  const height = rows.length * CHART.rowHeight + CHART.padding;
  const bars = [
    { side: 'A' as const, color: CHART.colorA, offset: 0 },
    { side: 'B' as const, color: CHART.colorB, offset: CHART.barHeight + CHART.barGap },
  ];

  return (
    <figure className="space-y-1">
      <svg
        viewBox={`0 0 ${CHART.width} ${height}`}
        className="w-full"
        role="img"
        aria-label={`Grafik batang perbandingan A dan B untuk ${rows.length} metrik. Angka lengkap ada di tabel.`}
      >
        <title>Grafik batang perbandingan A dan B</title>
        {rows.map((row, index) => {
          const top = index * CHART.rowHeight + CHART.padding;
          const fractions = barFractions(row.a, row.b);
          return (
            <g key={row.key} data-metric={row.key}>
              <text
                x={0}
                y={top + CHART.labelY}
                fontSize={CHART.fontSize}
                fontWeight="bold"
                fill={CHART.textStrong}
              >
                {row.label}
              </text>
              {bars.map(({ side, color, offset }) => {
                const value = side === 'A' ? row.a : row.b;
                const fraction = side === 'A' ? fractions.a : fractions.b;
                const width = fraction * CHART.barMax;
                const y = top + CHART.barsTop + offset;
                const winner = row.better === side;
                return (
                  <g key={side}>
                    <text
                      x={0}
                      y={y + CHART.barHeight - 3}
                      fontSize={CHART.fontSize}
                      fill={CHART.textSoft}
                    >
                      {side}
                    </text>
                    <rect
                      x={CHART.barX}
                      y={y}
                      width={width}
                      height={CHART.barHeight}
                      rx={3}
                      fill={color}
                    />
                    <text
                      x={CHART.barX + width + CHART.valueGap}
                      y={y + CHART.barHeight - 3}
                      fontSize={CHART.fontSize}
                      fill={winner ? CHART.textStrong : CHART.textSoft}
                      fontWeight={winner ? 'bold' : 'normal'}
                    >
                      {winner
                        ? `${formatNumber(value)} (lebih baik)`
                        : formatNumber(value)}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      <figcaption className="text-xs text-ink-300">
        Panjang batang dibandingkan per metrik (batang terpanjang = penuh).
        {summary.complete ? '' : ' Angka masih sementara sampai kedua sisi selesai.'}
      </figcaption>
    </figure>
  );
}