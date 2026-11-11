import { describe, expect, it } from 'vitest';
import { LEVEL_2_2_CONTENT } from '../level-2-2.content';

describe('Konten Level 2-2 (T-100)', () => {
  const c = LEVEL_2_2_CONTENT;

  it('intro 2 sampai 3 halaman dan tidak ada yang kosong', () => {
    expect(c.intro.length).toBeGreaterThanOrEqual(2);
    expect(c.intro.length).toBeLessThanOrEqual(3);
    for (const page of c.intro) expect(page.text.trim()).not.toBe('');
  });

  it('minimal 3 petunjuk bertahap', () => {
    expect(c.hints.length).toBeGreaterThanOrEqual(3);
    for (const hint of c.hints) expect(hint.trim()).not.toBe('');
  });

  it('konsep, penjelasan, dan judul hasil terisi', () => {
    expect(c.concepts.length).toBeGreaterThan(0);
    expect(c.explanation.pass.trim()).not.toBe('');
    expect(c.explanation.fail.trim()).not.toBe('');
    expect(c.resultTitle.pass.trim()).not.toBe('');
    expect(c.resultTitle.fail.trim()).not.toBe('');
  });

  it('menyebut tiga kebijakan, starvation, dan eksklusivitas penulis', () => {
    const all = `${c.explanation.pass} ${c.explanation.fail}`.toLowerCase();
    for (const word of [
      'reader',
      'writer',
      'fair',
      'starvation',
      'eksklusif',
    ]) {
      expect(all).toContain(word);
    }
  });
});
