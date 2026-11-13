import { describe, expect, it } from 'vitest';
import { patienceView } from '../patience';

describe('patienceView (T-053)', () => {
  it('baru mulai menunggu: bar kosong, level ok', () => {
    const view = patienceView('Penulis 1', 0, 10);
    expect(view.fraction).toBe(0);
    expect(view.level).toBe('ok');
    expect(view.label).toBe('Penulis 1: 0/10');
  });

  it('mendekati ambang: oranye', () => {
    expect(patienceView('P', 7, 10).level).toBe('warn');
    expect(patienceView('P', 6, 10).level).toBe('ok');
  });

  it('mencapai ambang: merah, penuh, dan labelnya menyebut kelaparan', () => {
    const view = patienceView('Penulis 2', 10, 10);
    expect(view.level).toBe('bad');
    expect(view.fraction).toBe(1);
    expect(view.label).toContain('KELAPARAN');
  });

  it('melewati ambang: fraksi dibatasi 1', () => {
    expect(patienceView('P', 25, 10).fraction).toBe(1);
  });

  it('ambang tidak valid (0): dianggap penuh, tidak membagi nol', () => {
    expect(patienceView('P', 0, 0).fraction).toBe(1);
  });
});
