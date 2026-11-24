import { describe, expect, it } from 'vitest';
import { moveTab } from '../catatan';
import { DEFAULT_GUIDE_TAB, GUIDE_TABS, guideMandorSays } from '../guideTabs';

describe('GUIDE_TABS', () => {
  it('empat tab, id unik, dan tab awal ada di daftar', () => {
    const ids = GUIDE_TABS.map((tab) => tab.id);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
    expect(ids).toContain(DEFAULT_GUIDE_TAB);
  });

  it('navigasi keyboard berputar melewati keempat tab', () => {
    expect(moveTab(GUIDE_TABS, 'cara', 'ArrowRight')).toBe('status');
    expect(moveTab(GUIDE_TABS, 'glosarium', 'ArrowRight')).toBe('cara');
    expect(moveTab(GUIDE_TABS, 'cara', 'End')).toBe('glosarium');
  });

  it('Pak Mandor punya ucapan untuk setiap tab', () => {
    for (const tab of GUIDE_TABS) {
      expect(guideMandorSays(tab.id).length).toBeGreaterThan(0);
    }
  });
});
