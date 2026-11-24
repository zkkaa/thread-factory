import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { CompareSummary } from '../../controller/compareMetrics';
import { CompareSummaryTable } from '../components/hud/CompareSummaryTable';

const summary: CompareSummary = {
  complete: true,
  okA: false,
  okB: true,
  wins: { A: 0, B: 1 },
  rows: [
    {
      key: 'wait',
      label: 'Total waktu tunggu',
      a: 0,
      b: 12,
      lowerIsBetter: true,
      better: 'A',
    },
    {
      key: 'throughput',
      label: 'Throughput (instruksi per tick)',
      a: 1.25,
      b: 1.25,
      lowerIsBetter: false,
      better: 'sama',
    },
  ],
};

describe('CompareSummaryTable', () => {
  it('menampilkan baris, pemenang dengan teks, dan hasil lulus/gagal', () => {
    const html = renderToStaticMarkup(
      <CompareSummaryTable summary={summary} />,
    );
    expect(html).toContain('Total waktu tunggu');
    expect(html).toContain('A lebih baik');
    expect(html).toContain('Sama');
    expect(html).toContain('Gagal');
    expect(html).toContain('Lulus');
    expect(html).toContain('1.25');
  });

  it('summary null menampilkan pesan', () => {
    const html = renderToStaticMarkup(<CompareSummaryTable summary={null} />);
    expect(html).toContain('Level belum dimuat');
  });
});
