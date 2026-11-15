import { describe, expect, it } from 'vitest';
import type { CompareSummary } from '../../controller/compareMetrics';
import { level1_1 } from '../../levels/module1/level-1-1';
import { level2_2 } from '../../levels/module2/level-2-2';
import { defaultSandboxValues } from '../../levels/sandbox';
import {
  combineFlags,
  describeBetter,
  formatNumber,
  planSide,
  summaryHeadline,
  verdictText,
} from '../comparePanel';

const summary = (patch: Partial<CompareSummary>): CompareSummary => ({
  rows: [],
  complete: true,
  okA: true,
  okB: true,
  wins: { A: 0, B: 0 },
  ...patch,
});

describe('planSide', () => {
  it('level tanpa parameter Sandbox dimuat apa adanya tanpa bintang', () => {
    const plan = planSide(level1_1, {});
    expect(plan.ok).toBe(true);
    if (plan.ok) {
      expect(plan.level).toBe(level1_1);
      expect(plan.options.rated).toBe(false);
    }
  });

  it('level dengan parameter Sandbox memakai nilai pilihan', () => {
    const plan = planSide(level2_2, {
      ...defaultSandboxValues('2-2'),
      lockPolicy: 'fair',
    });
    expect(plan.ok).toBe(true);
    if (plan.ok) expect(plan.options.rwPolicy).toBe('fair');
  });

  it('nilai tidak sah menghasilkan pesan, bukan error', () => {
    const plan = planSide(level2_2, { cores: 99 });
    expect(plan.ok).toBe(false);
  });
});

describe('teks perbandingan', () => {
  it('describeBetter dan verdictText', () => {
    expect(describeBetter('A')).toBe('A lebih baik');
    expect(describeBetter('B')).toBe('B lebih baik');
    expect(describeBetter('sama')).toBe('Sama');
    expect(verdictText(null)).toBe('Belum selesai');
    expect(verdictText(true)).toBe('Lulus');
    expect(verdictText(false)).toBe('Gagal');
  });

  it('formatNumber: bulat apa adanya, pecahan dua desimal', () => {
    expect(formatNumber(12)).toBe('12');
    expect(formatNumber(1.5)).toBe('1.50');
  });

  it('headline: belum selesai', () => {
    expect(summaryHeadline(summary({ complete: false }))).toMatch(
      /masih sementara/,
    );
  });

  it('headline: sisi yang gagal tidak dianggap menang', () => {
    expect(
      summaryHeadline(
        summary({ okA: false, okB: true, wins: { A: 5, B: 0 } }),
      ),
    ).toBe('B lulus, A gagal.');
    expect(summaryHeadline(summary({ okA: true, okB: false }))).toBe(
      'A lulus, B gagal.',
    );
  });

  it('headline: seimbang atau unggul', () => {
    expect(summaryHeadline(summary({ wins: { A: 2, B: 2 } }))).toMatch(
      /seimbang/,
    );
    expect(summaryHeadline(summary({ wins: { A: 3, B: 1 } }))).toBe(
      'A unggul di 3 metrik, B unggul di 1.',
    );
  });
});

describe('combineFlags', () => {
  const off = {
    showPause: false,
    canTogglePlay: false,
    canStep: false,
    canReset: false,
    canChangeSeed: false,
  };
  const on = {
    showPause: true,
    canTogglePlay: true,
    canStep: true,
    canReset: true,
    canChangeSeed: true,
  };

  it('aksi boleh bila salah satu sisi boleh', () => {
    const flags = combineFlags(on, off);
    expect(flags.canStep).toBe(true);
    expect(flags.showPause).toBe(true);
  });

  it('seed hanya boleh bila keduanya boleh', () => {
    expect(combineFlags(on, off).canChangeSeed).toBe(false);
    expect(combineFlags(on, on).canChangeSeed).toBe(true);
  });
});