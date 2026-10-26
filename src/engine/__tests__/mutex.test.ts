import { describe, it, expect } from 'vitest';
import { createPrng } from '../prng';
import { Mutex } from '../primitives/mutex';

describe('Mutex: kepemilikan', () => {
  it('mutex baru bebas', () => {
    expect(new Mutex('m').snapshot()).toEqual({
      id: 'm',
      owner: null,
      queue: [],
    });
  });

  it('LOCK pada mutex bebas langsung berhasil', () => {
    const m = new Mutex('m');
    expect(m.lock('A')).toBe(true);
    expect(m.snapshot().owner).toBe('A');
    expect(m.isOwnedBy('A')).toBe(true);
    expect(m.isOwnedBy('B')).toBe(false);
  });

  it('LOCK pada mutex terpakai membuat peminta antre dan tidak mengubah pemilik', () => {
    const m = new Mutex('m');
    m.lock('A');
    expect(m.lock('B')).toBe(false);
    expect(m.snapshot()).toEqual({ id: 'm', owner: 'A', queue: ['B'] });
  });

  it('tidak pernah dimiliki dua thread: pemilik tetap A sampai UNLOCK', () => {
    const m = new Mutex('m');
    m.lock('A');
    m.lock('B');
    m.lock('C');
    expect(m.snapshot().owner).toBe('A');
    expect(m.isOwnedBy('B')).toBe(false);
    expect(m.isOwnedBy('C')).toBe(false);
  });
});

describe('Mutex: antrean FIFO dan handoff', () => {
  it('UNLOCK menyerahkan mutex ke thread terdepan', () => {
    const m = new Mutex('m');
    m.lock('A');
    m.lock('B');
    m.lock('C');
    expect(m.unlock('A')).toBe('B');
    expect(m.snapshot()).toEqual({ id: 'm', owner: 'B', queue: ['C'] });
  });

  it('urutan perolehan mengikuti urutan antre (FIFO)', () => {
    const m = new Mutex('m');
    m.lock('A');
    for (const id of ['B', 'C', 'D', 'E']) m.lock(id);
    const order: (string | null)[] = [];
    let holder = 'A';
    for (let i = 0; i < 4; i++) {
      const next = m.unlock(holder);
      order.push(next);
      holder = next as string;
    }
    expect(order).toEqual(['B', 'C', 'D', 'E']);
  });

  it('UNLOCK tanpa antrean membuat mutex bebas dan mengembalikan null', () => {
    const m = new Mutex('m');
    m.lock('A');
    expect(m.unlock('A')).toBeNull();
    expect(m.snapshot()).toEqual({ id: 'm', owner: null, queue: [] });
    expect(m.lock('B')).toBe(true);
  });
});

describe('Mutex: pelanggaran penggunaan', () => {
  it('UNLOCK oleh bukan pemilik melempar error yang menyebut pemilik', () => {
    const m = new Mutex('papan');
    m.lock('A');
    expect(() => m.unlock('B')).toThrow(
      /"B".*UNLOCK.*"papan".*bukan miliknya.*"A"/,
    );
  });

  it('UNLOCK pada mutex bebas melempar error', () => {
    expect(() => new Mutex('papan').unlock('A')).toThrow(
      /bukan miliknya.*bebas/,
    );
  });

  it('UNLOCK yang gagal tidak mengubah keadaan mutex', () => {
    const m = new Mutex('m');
    m.lock('A');
    m.lock('B');
    expect(() => m.unlock('B')).toThrow();
    expect(m.snapshot()).toEqual({ id: 'm', owner: 'A', queue: ['B'] });
  });

  it('LOCK ulang oleh pemilik melempar error (tidak rekursif)', () => {
    const m = new Mutex('m');
    m.lock('A');
    expect(() => m.lock('A')).toThrow(/tidak rekursif/);
  });

  it('LOCK oleh thread yang sudah antre melempar error', () => {
    const m = new Mutex('m');
    m.lock('A');
    m.lock('B');
    expect(() => m.lock('B')).toThrow(/sudah mengantre/);
  });
});

describe('Mutex: invarian pada operasi acak', () => {
  it('pemilik tidak pernah ada di antrean, antrean tanpa duplikat, dan semua lock terlayani', () => {
    const prng = createPrng(2026);
    const ids = ['A', 'B', 'C', 'D', 'E'];
    const m = new Mutex('m');
    const waiting = new Set<string>();

    for (let step = 0; step < 5000; step++) {
      const snap = m.snapshot();
      const id = prng.pick(ids);
      if (snap.owner === id) {
        const next = m.unlock(id);
        if (next !== null) waiting.delete(next);
      } else if (!waiting.has(id)) {
        if (!m.lock(id)) waiting.add(id);
      }

      const after = m.snapshot();
      if (after.owner !== null) expect(after.queue).not.toContain(after.owner);
      expect(new Set(after.queue).size).toBe(after.queue.length);
      expect(new Set(after.queue)).toEqual(waiting);
      // mutex bebas hanya bila tidak ada yang menunggu
      if (after.owner === null) expect(after.queue).toHaveLength(0);
    }
  });
});

describe('Mutex: snapshot', () => {
  it('mengembalikan salinan antrean', () => {
    const m = new Mutex('m');
    m.lock('A');
    m.lock('B');
    m.snapshot().queue.push('hantu');
    expect(m.snapshot().queue).toEqual(['B']);
  });
});
