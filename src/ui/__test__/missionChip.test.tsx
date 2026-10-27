import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { level1_1 } from '../../levels/module1/level-1-1';
import type { LevelDefinition } from '../../levels/types';
import { MissionChip } from '../components/hud/MissionChip';
import { deriveMission } from '../missionSummary';

describe('deriveMission', () => {
  it('mengambil target dan ambang bintang dari data level', () => {
    const mission = deriveMission(level1_1);
    expect(mission.targetText).toBe('stok = 10');
    expect(mission.stars.map((s) => s.stars)).toEqual([1, 2, 3]);
    expect(mission.stars[1].text).toContain(String(level1_1.goal.stars.fast));
    expect(mission.stars[2].text).toContain(
      String(level1_1.goal.stars.lowWait),
    );
  });

  it('mencatat seed tutorial bila level punya', () => {
    expect(deriveMission(level1_1).seedNote).toContain('10');
  });

  it('tanpa catatan seed bila level tidak punya tutorialSeed', () => {
    const level: LevelDefinition = { ...level1_1, tutorialSeed: undefined };
    expect(deriveMission(level).seedNote).toBeNull();
  });
});

describe('MissionChip', () => {
  const html = renderToStaticMarkup(<MissionChip level={level1_1} />);

  it('tampil terbuka dan dapat dilipat (details/summary)', () => {
    expect(html).toContain('<details');
    expect(html).toMatch(/<details[^>]*open=""/);
    expect(html).toContain('<summary');
  });

  it('menampilkan target dan ketiga kriteria bintang', () => {
    expect(html).toContain('stok = 10');
    expect(html).toContain('Bintang 1:');
    expect(html).toContain('Bintang 2:');
    expect(html).toContain('Bintang 3:');
    expect(html).toContain('60 tick');
    expect(html).toContain('25 tick');
  });

  it('menampilkan catatan seed tutorial', () => {
    expect(html).toContain('seed tutorial (10)');
  });

  it('punya label untuk pembaca layar', () => {
    expect(html).toContain('aria-label="Misi level"');
  });
});
