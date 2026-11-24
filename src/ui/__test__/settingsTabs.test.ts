import { describe, expect, it } from 'vitest';
import { boardWidthCss, moveTab } from '../catatan';
import {
  DEFAULT_SETTINGS_TAB,
  SETTINGS_TABS,
  mandorSays,
} from '../settingsTabs';

describe('moveTab', () => {
  it('panah kanan dan kiri berputar di ujung', () => {
    expect(moveTab(SETTINGS_TABS, 'umum', 'ArrowRight')).toBe('skor');
    expect(moveTab(SETTINGS_TABS, 'kredit', 'ArrowRight')).toBe('umum');
    expect(moveTab(SETTINGS_TABS, 'umum', 'ArrowLeft')).toBe('kredit');
  });

  it('Home dan End ke tab pertama dan terakhir', () => {
    expect(moveTab(SETTINGS_TABS, 'skor', 'Home')).toBe('umum');
    expect(moveTab(SETTINGS_TABS, 'skor', 'End')).toBe('kredit');
  });

  it('tombol lain tidak mengubah tab', () => {
    expect(moveTab(SETTINGS_TABS, 'umum', 'Enter')).toBeNull();
    expect(moveTab([], 'umum', 'ArrowRight')).toBeNull();
  });
});

describe('boardWidthCss', () => {
  it('membatasi lebar papan oleh lebar dan tinggi layar', () => {
    const css = boardWidthCss();
    expect(css).toContain('min(');
    expect(css).toContain('vw');
    expect(css).toContain('vh');
  });
});

describe('SETTINGS_TABS dan mandorSays', () => {
  it('tab awal ada di daftar dan id unik', () => {
    const ids = SETTINGS_TABS.map((tab) => tab.id);
    expect(ids).toContain(DEFAULT_SETTINGS_TAB);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('Pak Mandor menyindir saat volume 0% dan punya ucapan tiap tab', () => {
    expect(mandorSays('umum', 0)).toContain('Sepi');
    expect(mandorSays('umum', 70)).not.toContain('Sepi');
    for (const tab of SETTINGS_TABS) {
      expect(mandorSays(tab.id, 50).length).toBeGreaterThan(0);
    }
  });
});
