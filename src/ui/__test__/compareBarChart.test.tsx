import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { CompareSummary } from '../../controller/compareMetrics';
import { CompareBarChart } from '../components/hud/CompareBarChart';

const summary: CompareSummary = {
  rows: [
    {
      key: 'ticks',
      label: 'Total tick',
      a: 40,
      b: 20,
      lowerIsBetter: true,
      better: 'B',
    },
    {
      key: 'wait',
      label: 'Total waktu tunggu',
      a: 0,
      b: 0,
      lowerIsBetter: true,
      better: 'sama',
    },
  ],
  complete: true,
  okA: true,
  okB: true,
  wins: { A: 0, B: 1 },
};

describe('CompareBarChart', () => {
  it('memiliki teks alternatif dan satu grup per metrik', () => {
    const html = renderToStaticMarkup(<CompareBarChart summary={summary} />);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Grafik batang perbandingan A dan B untuk 2 metrik');
    expect(html).toContain('data-metric="ticks"');
    expect(html).toContain('data-metric="wait"');
  });

  it('menandai pemenang dengan teks, bukan hanya warna', () => {
    const html = renderToStaticMarkup(<CompareBarChart summary={summary} />);
    expect(html).toContain('20 (lebih baik)');
    expect(html).not.toContain('40 (lebih baik)');
  });

  it('metrik bernilai sama tidak punya penanda lebih baik', () => {
    const only: CompareSummary = { ...summary, rows: [summary.rows[1]!] };
    const html = renderToStaticMarkup(<CompareBarChart summary={only} />);
    expect(html).not.toContain('lebih baik)');
  });

  it('menandai angka sementara bila belum selesai', () => {
    const html = renderToStaticMarkup(
      <CompareBarChart summary={{ ...summary, complete: false }} />,
    );
    expect(html).toContain('masih sementara');
  });

  it('tidak merender apa pun bila tidak ada baris', () => {
    const html = renderToStaticMarkup(
      <CompareBarChart summary={{ ...summary, rows: [] }} />,
    );
    expect(html).toBe('');
  });
});