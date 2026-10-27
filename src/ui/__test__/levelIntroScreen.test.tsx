import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { level1_1 } from '../../levels/module1/level-1-1';
import type { Navigation } from '../navigation';
import { LevelIntroScreen } from '../screens/LevelIntroScreen';

const navigation: Navigation = {
  screen: { id: 'levelIntro', levelId: '1-1' },
  canGo: () => true,
  go: () => {},
  replace: () => {},
  back: () => {},
  selectModeTab: () => {},
};

describe('LevelIntroScreen', () => {
  it('menampilkan badge level, dialog, Lewati, dan Kembali', () => {
    const html = renderToStaticMarkup(
      <LevelIntroScreen navigation={navigation} level={level1_1} />,
    );
    expect(html).toContain('Level 1-1: Bug Papan Stok');
    expect(html).toContain('Lewati');
    expect(html).toContain('Lanjut');
    expect(html).toContain('aria-label="Kembali"');
  });
});
