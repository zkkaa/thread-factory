import { describe, expect, it } from 'vitest';
import { MODULES } from '../../levels/modules';
import type { LevelProgress, ProgressData } from '../../progress/progressStore';
import {
  buildGameSummary,
  buildModuleSummary,
  collectConcepts,
  findNextModule,
} from '../completion';

function buatProgress(
  levels: Record<string, LevelProgress> = {},
): ProgressData {
  return { version: 1, levels };
}

const selesai = (stars: 1 | 2 | 3): LevelProgress => ({
  bestStars: stars,
  cleared: true,
});

/** Hanya 1-1 dan 1-2 yang punya data konsep. */
const konsep = (levelId: string): readonly string[] | undefined => {
  if (levelId === '1-1') return ['Race condition', 'Critical section', 'Mutex'];
  if (levelId === '1-2') return ['Mutex', 'Granularitas lock'];
  return undefined;
};

describe('collectConcepts', () => {
  it('mengumpulkan konsep unik dari level selesai, urut menurut level', () => {
    const progress = buatProgress({ '1-1': selesai(3), '1-2': selesai(2) });
    expect(collectConcepts(MODULES[0], progress, konsep)).toEqual([
      'Race condition',
      'Critical section',
      'Mutex',
      'Granularitas lock',
    ]);
  });

  it('level selesai tanpa data konsep diabaikan', () => {
    const progress = buatProgress({ '1-1': selesai(1), '1-3': selesai(1) });
    expect(collectConcepts(MODULES[0], progress, konsep)).toEqual([
      'Race condition',
      'Critical section',
      'Mutex',
    ]);
  });

  it('level yang belum selesai tidak ikut dihitung', () => {
    const progress = buatProgress({ '1-1': selesai(1) });
    expect(collectConcepts(MODULES[0], progress, konsep)).not.toContain(
      'Granularitas lock',
    );
  });

  it('tanpa level selesai memakai konsep modul', () => {
    expect(collectConcepts(MODULES[0], buatProgress(), konsep)).toEqual(
      MODULES[0].concepts,
    );
  });
});

describe('buildModuleSummary', () => {
  it('menjumlahkan bintang terbaik; maksimum 3 per level', () => {
    const progress = buatProgress({ '1-1': selesai(2), '1-2': selesai(3) });
    const summary = buildModuleSummary(MODULES[0], progress, konsep);
    expect(summary.starsEarned).toBe(5);
    expect(summary.starsMax).toBe(15);
  });
});

describe('buildGameSummary', () => {
  it('menjumlahkan semua modul: maksimum 27 bintang', () => {
    const progress = buatProgress({ '1-1': selesai(3), '2-1': selesai(1) });
    const summary = buildGameSummary(MODULES, progress, konsep);
    expect(summary.starsEarned).toBe(4);
    expect(summary.starsMax).toBe(27);
  });

  it('menggabungkan konsep unik; modul tanpa progres memakai konsep modulnya', () => {
    const progress = buatProgress({ '1-1': selesai(3) });
    const summary = buildGameSummary(MODULES, progress, konsep);
    expect(summary.concepts).toContain('Race condition');
    expect(summary.concepts).toContain('Deadlock dan kondisi Coffman');
    expect(new Set(summary.concepts).size).toBe(summary.concepts.length);
  });
});

describe('findNextModule', () => {
  it('Modul 1 diikuti Modul 2', () => {
    expect(findNextModule(MODULES, 1)?.id).toBe(2);
  });

  it('modul terakhir dan id tak dikenal tidak punya modul berikutnya', () => {
    expect(findNextModule(MODULES, 2)).toBeUndefined();
    expect(findNextModule(MODULES, 99)).toBeUndefined();
  });
});
