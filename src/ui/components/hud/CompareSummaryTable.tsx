import type { CompareSummary } from '../../../controller/compareMetrics';
import {
  describeBetter,
  formatNumber,
  summaryHeadline,
  verdictText,
} from '../../comparePanel';
import { CompareBarChart } from './CompareBarChart';

interface CompareSummaryTableProps {
  summary: CompareSummary | null;
}

/** Tabel dan grafik batang perbandingan A dan B. Pemenang ditulis dengan teks, bukan hanya warna. */
export function CompareSummaryTable({ summary }: CompareSummaryTableProps) {
  if (summary === null) {
    return (
      <section
        aria-label="Perbandingan metrik"
        className="rounded-lg border border-navy-500 bg-navy-800 p-3 text-sm text-ink-300"
      >
        Level belum dimuat.
      </section>
    );
  }

  return (
    <section
      aria-label="Perbandingan metrik"
      className="space-y-2 rounded-lg border border-navy-500 bg-navy-800 p-3"
    >
      <p className="text-sm font-semibold text-sun-400">
        {summaryHeadline(summary)}
      </p>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-navy-500 text-ink-300">
            <th scope="col" className="py-1 pr-2">
              Metrik
            </th>
            <th scope="col" className="py-1 pr-2">
              A
            </th>
            <th scope="col" className="py-1 pr-2">
              B
            </th>
            <th scope="col" className="py-1">
              Lebih baik
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-navy-700">
            <th scope="row" className="py-1 pr-2 font-normal">
              Hasil
            </th>
            <td className="py-1 pr-2">{verdictText(summary.okA)}</td>
            <td className="py-1 pr-2">{verdictText(summary.okB)}</td>
            <td className="py-1 text-ink-300">-</td>
          </tr>
          {summary.rows.map((row) => (
            <tr key={row.key} className="border-b border-navy-700">
              <th scope="row" className="py-1 pr-2 font-normal">
                {row.label}
              </th>
              <td className="py-1 pr-2">{formatNumber(row.a)}</td>
              <td className="py-1 pr-2">{formatNumber(row.b)}</td>
              <td
                data-better={row.better}
                className={`py-1 ${
                  row.better === 'sama'
                    ? 'text-ink-300'
                    : 'font-bold text-sun-400'
                }`}
              >
                {describeBetter(row.better)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <CompareBarChart summary={summary} />
    </section>
  );
}
