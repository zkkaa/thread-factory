import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ScoreboardData } from '../../progress/scoreboardStore';
import { ScoreboardPanel } from '../components/ScoreboardPanel';
import { buildScoreboard, starsLabel } from '../scoreboardView';

const LEVELS = [
  { id: '1-1', title: 'Bug Papan Stok' },
  { id: '1-2', title: 'Pintu Kebesaran' },
];

const DATA: ScoreboardData = {
  version: 1,
  groups: {
    '1-1|10': [
      { stars: 3, ticks: 40, waitTicks: 10, date: '2026-11-16T08:00:00.000Z' },
      { stars: 1, ticks: 70, waitTicks: 30, date: '2026-11-15T08:00:00.000Z' },
    ],
    '1-1|5': [
      {
        stars: null,
        ticks: 50,
        waitTicks: 12,
        date: '2026-11-14T08:00:00.000Z',
      },
    ],
    '9-9|1': [
      { stars: 1, ticks: 1, waitTicks: 1, date: '2026-11-14T08:00:00.000Z' },
    ],
  },
};

describe('starsLabel', () => {
  it('menulis dengan kata', () => {
    expect(starsLabel(3)).toBe('3 bintang');
    expect(starsLabel(null)).toBe('Tanpa bintang');
  });
});

describe('buildScoreboard', () => {
  it('mengurutkan seed naik, memberi peringkat, dan memotong tanggal', () => {
    const boards = buildScoreboard(DATA, LEVELS);
    expect(boards).toHaveLength(1);
    const first = boards[0];
    expect(first?.seeds.map((s) => s.seed)).toEqual([5, 10]);
    const ten = first?.seeds[1];
    expect(ten?.rows.map((r) => r.rank)).toEqual([1, 2]);
    expect(ten?.rows[0]).toMatchObject({
      stars: '3 bintang',
      ticks: 40,
      waitTicks: 10,
      date: '2026-11-16',
    });
  });

  it('melewati level tanpa rekor dan level yang tidak dikenal', () => {
    const ids = buildScoreboard(DATA, LEVELS).map((b) => b.levelId);
    expect(ids).toEqual(['1-1']);
  });
});

describe('ScoreboardPanel', () => {
  it('menampilkan pesan kosong bila belum ada rekor', () => {
    const html = renderToStaticMarkup(
      <ScoreboardPanel data={{ version: 1, groups: {} }} levels={LEVELS} />,
    );
    expect(html).toContain('Belum ada rekor');
    expect(html).not.toContain('<table');
  });

  it('menampilkan judul, seed, dan baris rekor dengan header tabel', () => {
    const html = renderToStaticMarkup(
      <ScoreboardPanel data={DATA} levels={LEVELS} />,
    );
    expect(html).toContain('aria-label="Papan skor"');
    expect(html).toContain('Level 1-1: Bug Papan Stok');
    expect(html).toContain('Seed 10');
    expect(html).toContain('3 bintang');
    expect(html).toContain('Tanpa bintang');
    expect(html).toContain('scope="col"');
    expect(html).not.toContain('9-9');
  });
});
