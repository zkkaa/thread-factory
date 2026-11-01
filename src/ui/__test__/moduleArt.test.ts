import { describe, expect, it } from 'vitest';
import { moduleBuildingImage, moduleMapBackground } from '../moduleArt';
import { UI_ASSETS } from '../uiAssets';

describe('moduleArt', () => {
  it('memberi peta latar untuk Modul 1 dan 2, null untuk modul lain', () => {
    expect(moduleMapBackground(1)).toBe(UI_ASSETS.mapLevelsModule1);
    expect(moduleMapBackground(2)).toBe(UI_ASSETS.mapLevelsModule2);
    expect(moduleMapBackground(99)).toBeNull();
  });

  it('memakai gambar bangunan yang sama dengan denah', () => {
    expect(moduleBuildingImage(1)).toBe(UI_ASSETS.buildingModule1);
    expect(moduleBuildingImage(2)).toBe(UI_ASSETS.buildingModule2);
    expect(moduleBuildingImage(99)).toBeNull();
  });
});
