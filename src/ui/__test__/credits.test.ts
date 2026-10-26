import { describe, expect, it } from 'vitest';
import {
  ASSET_CREDITS,
  GENERATOR_NOTE,
  ICON_NOTE,
  TEAM_MEMBERS,
} from '../credits';

describe('credits', () => {
  it('setiap kredit aset punya nama, sumber, dan lisensi', () => {
    for (const credit of ASSET_CREDITS) {
      expect(credit.name.length).toBeGreaterThan(0);
      expect(credit.source.length).toBeGreaterThan(0);
      expect(credit.license.length).toBeGreaterThan(0);
    }
  });

  it('nama kredit aset unik', () => {
    const names = ASSET_CREDITS.map((credit) => credit.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('tim terdiri dari enam anggota dengan nama unik', () => {
    expect(TEAM_MEMBERS).toHaveLength(6);
    expect(new Set(TEAM_MEMBERS).size).toBe(6);
  });

  it('catatan potret generator dan ikon tim ada (PRD bagian 12 dan 18.4)', () => {
    expect(GENERATOR_NOTE).toContain('generator gambar');
    expect(ICON_NOTE).toContain('tim');
  });
});
