import { describe, expect, it } from 'vitest';
import {
  MAX_ENTRIES_PER_GROUP,
  SCOREBOARD_KEY,
  ScoreboardStore,
  groupKey,
  parseGroupKey,
  parseScoreboard,
  rankEntries,
  type ScoreEntry,
} from '../scoreboardStore';
import { createMemoryStorage, type KeyValueStorage } from '../storage';

function makeStore(storage: KeyValueStorage = createMemoryStorage()) {
  let tick = 0;
  const store = new ScoreboardStore(storage, () => {
    tick += 1000;
    return tick;
  });
  return { store, storage };
}

const entry = (
  stars: ScoreEntry['stars'],
  ticks: number,
  waitTicks: number,
  date = '2026-11-16T00:00:00.000Z',
): ScoreEntry => ({ stars, ticks, waitTicks, date });

describe('groupKey dan parseGroupKey', () => {
  it('saling berkebalikan', () => {
    expect(parseGroupKey(groupKey('1-1', 10))).toEqual({
      levelId: '1-1',
      seed: 10,
    });
    expect(parseGroupKey(groupKey('1-1', -5))).toEqual({
      levelId: '1-1',
      seed: -5,
    });
  });

  it('bentuk yang salah menghasilkan null', () => {
    expect(parseGroupKey('tanpa-pemisah')).toBeNull();
    expect(parseGroupKey('1-1|abc')).toBeNull();
    expect(parseGroupKey('|10')).toBeNull();
  });
});

describe('rankEntries', () => {
  it('bintang lebih banyak menang, lalu tick, lalu tunggu', () => {
    const ranked = rankEntries([
      entry(2, 30, 5),
      entry(3, 50, 9),
      entry(3, 40, 20),
      entry(3, 40, 10),
    ]);
    expect(ranked.map((e) => [e.stars, e.ticks, e.waitTicks])).toEqual([
      [3, 40, 10],
      [3, 40, 20],
      [3, 50, 9],
      [2, 30, 5],
    ]);
  });

  it('bintang null dihitung sebagai nol dan masukan tidak diubah', () => {
    const input = [entry(null, 10, 1), entry(1, 99, 99)];
    const ranked = rankEntries(input);
    expect(ranked[0]?.stars).toBe(1);
    expect(input[0]?.stars).toBeNull();
  });
});

describe('ScoreboardStore.record', () => {
  it('mencatat hasil dan mengembalikan true', () => {
    const { store } = makeStore();
    expect(store.record('1-1', 10, { stars: 2, ticks: 40, waitTicks: 12 })).toBe(
      true,
    );
    const top = store.top('1-1', 10);
    expect(top).toHaveLength(1);
    expect(top[0]).toMatchObject({ stars: 2, ticks: 40, waitTicks: 12 });
  });

  it('kelompok terpisah per level dan per seed', () => {
    const { store } = makeStore();
    store.record('1-1', 10, { stars: 1, ticks: 40, waitTicks: 1 });
    store.record('1-1', 11, { stars: 1, ticks: 41, waitTicks: 1 });
    store.record('1-2', 10, { stars: 1, ticks: 42, waitTicks: 1 });
    expect(store.top('1-1', 10)).toHaveLength(1);
    expect(store.top('1-1', 11)).toHaveLength(1);
    expect(store.top('1-2', 10)).toHaveLength(1);
    expect(store.top('1-3', 10)).toEqual([]);
  });

  it('menyimpan hanya lima terbaik', () => {
    const { store } = makeStore();
    for (let ticks = 50; ticks < 60; ticks += 1) {
      store.record('1-1', 10, { stars: 1, ticks, waitTicks: 0 });
    }
    const top = store.top('1-1', 10);
    expect(top).toHaveLength(MAX_ENTRIES_PER_GROUP);
    expect(top.map((e) => e.ticks)).toEqual([50, 51, 52, 53, 54]);
  });

  it('hasil di luar lima terbaik ditolak', () => {
    const { store } = makeStore();
    for (let ticks = 10; ticks < 15; ticks += 1) {
      store.record('1-1', 10, { stars: 1, ticks, waitTicks: 0 });
    }
    expect(store.record('1-1', 10, { stars: 1, ticks: 99, waitTicks: 0 })).toBe(
      false,
    );
  });

  it('hasil yang sama persis tidak dicatat dua kali', () => {
    const { store } = makeStore();
    const result = { stars: 3 as const, ticks: 40, waitTicks: 10 };
    expect(store.record('1-1', 10, result)).toBe(true);
    expect(store.record('1-1', 10, result)).toBe(false);
    expect(store.top('1-1', 10)).toHaveLength(1);
  });

  it('menolak masukan tidak valid', () => {
    const { store } = makeStore();
    expect(store.record('1-1', 1.5, { stars: 1, ticks: 1, waitTicks: 1 })).toBe(
      false,
    );
    expect(store.record('1-1', 1, { stars: 1, ticks: -1, waitTicks: 1 })).toBe(
      false,
    );
    expect(
      store.record('1-1', 1, { stars: 1, ticks: 1, waitTicks: Number.NaN }),
    ).toBe(false);
    expect(
      store.record('1-1', 1, {
        stars: 9 as unknown as 1,
        ticks: 1,
        waitTicks: 1,
      }),
    ).toBe(false);
    expect(store.getState().groups).toEqual({});
  });

  it('memberi tahu pelanggan hanya saat ada perubahan dan bisa berhenti', () => {
    const { store } = makeStore();
    let calls = 0;
    const off = store.subscribe(() => {
      calls += 1;
    });
    store.record('1-1', 10, { stars: 1, ticks: 40, waitTicks: 1 });
    store.record('1-1', 10, { stars: 1, ticks: 40, waitTicks: 1 });
    expect(calls).toBe(1);
    off();
    store.record('1-1', 10, { stars: 1, ticks: 39, waitTicks: 1 });
    expect(calls).toBe(1);
  });

  it('getState mengembalikan objek yang sama bila tidak ada perubahan', () => {
    const { store } = makeStore();
    const before = store.getState();
    store.record('1-1', 1.5, { stars: 1, ticks: 1, waitTicks: 1 });
    expect(store.getState()).toBe(before);
  });
});

describe('penyimpanan', () => {
  it('rekor bertahan di instance baru dengan penyimpanan yang sama', () => {
    const { store, storage } = makeStore();
    store.record('1-1', 10, { stars: 3, ticks: 40, waitTicks: 10 });
    const { store: again } = makeStore(storage);
    expect(again.top('1-1', 10)[0]).toMatchObject({ stars: 3, ticks: 40 });
  });

  it('data rusak menghasilkan papan kosong', () => {
    for (const raw of [
      'bukan json',
      '[]',
      '{"version":2,"groups":{}}',
      '{"version":1,"groups":[]}',
      '{"version":1,"groups":{"tanpa-pemisah":[]}}',
      '{"version":1,"groups":{"1-1|10":[{"stars":1}]}}',
      '{"version":1,"groups":{"1-1|10":[{"stars":1,"ticks":-3,"waitTicks":0,"date":"x"}]}}',
    ]) {
      expect(parseScoreboard(raw).groups).toEqual({});
    }
    expect(parseScoreboard(null).groups).toEqual({});
  });

  it('data tersimpan yang tidak terurut dirapikan saat dibaca', () => {
    const raw = JSON.stringify({
      version: 1,
      groups: {
        '1-1|10': [entry(1, 50, 0), entry(3, 40, 0)],
      },
    });
    const parsed = parseScoreboard(raw);
    expect(parsed.groups['1-1|10']?.[0]?.stars).toBe(3);
  });

  it('penyimpanan yang selalu gagal tidak mengganggu state di memori', () => {
    const broken: KeyValueStorage = {
      getItem: () => {
        throw new Error('diblokir');
      },
      setItem: () => {
        throw new Error('penuh');
      },
      removeItem: () => {
        throw new Error('diblokir');
      },
    };
    const { store } = makeStore(broken);
    expect(store.record('1-1', 10, { stars: 1, ticks: 40, waitTicks: 1 })).toBe(
      true,
    );
    expect(store.top('1-1', 10)).toHaveLength(1);
    expect(() => store.reset()).not.toThrow();
  });

  it('reset menghapus papan dan kunci penyimpanan', () => {
    const { store, storage } = makeStore();
    store.record('1-1', 10, { stars: 1, ticks: 40, waitTicks: 1 });
    store.reset();
    expect(store.top('1-1', 10)).toEqual([]);
    expect(storage.getItem(SCOREBOARD_KEY)).toBeNull();
  });
});