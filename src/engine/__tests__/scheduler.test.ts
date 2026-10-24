import { describe, it, expect } from 'vitest';
import { createPrng } from '../prng';
import { createScheduler } from '../scheduler';

const IDS = ['A', 'B', 'C', 'D'];

function randomScheduler(seed: number, cores = 1) {
  return createScheduler({ kind: 'random', cores }, createPrng(seed));
}

function scriptedScheduler(script: string[], cores = 1) {
  return createScheduler({ kind: 'scripted', cores, script }, createPrng(1));
}

describe('scheduler random', () => {
  it('cores = 1 memilih tepat satu thread dari yang boleh jalan', () => {
    const s = randomScheduler(1);
    for (let i = 0; i < 100; i++) {
      const picked = s.pick(IDS);
      expect(picked).toHaveLength(1);
      expect(IDS).toContain(picked[0]);
    }
  });

  it('deterministik: seed sama menghasilkan urutan pilihan yang sama', () => {
    const run = (seed: number) => {
      const s = randomScheduler(seed);
      return Array.from({ length: 50 }, () => s.pick(IDS));
    };
    expect(run(42)).toEqual(run(42));
    expect(run(1)).not.toEqual(run(2));
  });

  it('semua thread punya kesempatan terpilih', () => {
    const s = randomScheduler(5);
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(s.pick(IDS)[0] as string);
    expect([...seen].sort()).toEqual(IDS);
  });

  it('cores = 2 memilih dua thread berbeda', () => {
    const s = randomScheduler(3, 2);
    for (let i = 0; i < 100; i++) {
      const picked = s.pick(IDS);
      expect(picked).toHaveLength(2);
      expect(new Set(picked).size).toBe(2);
    }
  });

  it('cores lebih besar dari jumlah thread: semua terpilih', () => {
    const picked = randomScheduler(3, 10).pick(['A', 'B']);
    expect([...picked].sort()).toEqual(['A', 'B']);
  });

  it('tidak ada thread yang boleh jalan: hasil kosong', () => {
    expect(randomScheduler(1).pick([])).toEqual([]);
  });
});

describe('scheduler scripted', () => {
  it('mengikuti urutan script', () => {
    const s = scriptedScheduler(['A', 'B', 'B', 'A']);
    const result = [1, 2, 3, 4].map(() => s.pick(['A', 'B']));
    expect(result).toEqual([['A'], ['B'], ['B'], ['A']]);
  });

  it('melewati entri untuk thread yang tidak bisa jalan', () => {
    const s = scriptedScheduler(['A', 'B', 'A']);
    // A tidak bisa jalan (mis. WAITING): entri A dilewati, B terpilih
    expect(s.pick(['B'])).toEqual(['B']);
    // entri A berikutnya juga dilewati; script habis -> isi dengan thread yang boleh jalan
    expect(s.pick(['B'])).toEqual(['B']);
  });

  it('script habis: thread yang boleh jalan dipilih menurut urutan definisi', () => {
    const s = scriptedScheduler(['B']);
    expect(s.pick(['A', 'B'])).toEqual(['B']);
    expect(s.pick(['A', 'B'])).toEqual(['A']);
    expect(s.pick(['A', 'B'])).toEqual(['A']);
    expect(s.pick(['B'])).toEqual(['B']);
  });

  it('cores = 2: entri duplikat dalam satu tick ditunda ke tick berikutnya', () => {
    const s = scriptedScheduler(['A', 'A', 'B'], 2);
    expect(s.pick(['A', 'B', 'C'])).toEqual(['A']);
    expect(s.pick(['A', 'B', 'C'])).toEqual(['A', 'B']);
  });

  it('selalu memilih minimal satu thread bila ada yang boleh jalan', () => {
    const s = scriptedScheduler(['X', 'Y', 'Z']);
    expect(s.pick(['A'])).toEqual(['A']);
  });

  it('tidak ada thread yang boleh jalan: hasil kosong', () => {
    expect(scriptedScheduler(['A']).pick([])).toEqual([]);
  });
});
