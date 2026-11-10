import { describe, expect, it } from 'vitest';
import { RwLock, type RwPolicy } from '../primitives/rwlock';

const lock = (policy: RwPolicy) => new RwLock('papan', policy);

describe('RwLock: dasar (semua kebijakan)', () => {
  for (const policy of ['reader', 'writer', 'fair'] as const) {
    it(`${policy}: banyak pembaca boleh bersamaan`, () => {
      const l = lock(policy);
      expect(l.acquireRead('R1')).toBe(true);
      expect(l.acquireRead('R2')).toBe(true);
      expect(l.snapshot().readers).toEqual(['R1', 'R2']);
    });

    it(`${policy}: penulis harus sendirian`, () => {
      const l = lock(policy);
      expect(l.acquireWrite('W1')).toBe(true);
      expect(l.acquireRead('R1')).toBe(false);
      expect(l.acquireWrite('W2')).toBe(false);
      expect(l.snapshot().writer).toBe('W1');
    });

    it(`${policy}: penulis menunggu sampai semua pembaca selesai`, () => {
      const l = lock(policy);
      l.acquireRead('R1');
      l.acquireRead('R2');
      expect(l.acquireWrite('W1')).toBe(false);
      expect(l.releaseRead('R1')).toEqual([]);
      expect(l.releaseRead('R2')).toEqual(['W1']);
      expect(l.snapshot().writer).toBe('W1');
    });
  }
});

describe('RwLock: reader priority', () => {
  it('pembaca baru tetap masuk walau penulis menunggu (penulis bisa kelaparan)', () => {
    const l = lock('reader');
    expect(l.acquireRead('R1')).toBe(true);
    expect(l.acquireWrite('W1')).toBe(false);
    expect(l.acquireRead('R2')).toBe(true);
    expect(l.releaseRead('R1')).toEqual([]);
    expect(l.releaseRead('R2')).toEqual(['W1']);
  });

  it('setelah penulis selesai, pembaca menunggu didahulukan dari penulis', () => {
    const l = lock('reader');
    l.acquireWrite('W0');
    l.acquireWrite('W1');
    l.acquireRead('R1');
    expect(l.releaseWrite('W0')).toEqual(['R1']);
    expect(l.releaseRead('R1')).toEqual(['W1']);
  });
});

describe('RwLock: writer priority', () => {
  it('pembaca baru antre bila ada penulis menunggu', () => {
    const l = lock('writer');
    l.acquireRead('R1');
    expect(l.acquireWrite('W1')).toBe(false);
    expect(l.acquireRead('R2')).toBe(false);
    expect(l.releaseRead('R1')).toEqual(['W1']);
    expect(l.releaseWrite('W1')).toEqual(['R2']);
  });

  it('setelah penulis selesai, penulis menunggu didahulukan dari pembaca', () => {
    const l = lock('writer');
    l.acquireWrite('W0');
    l.acquireRead('R1');
    l.acquireWrite('W1');
    expect(l.releaseWrite('W0')).toEqual(['W1']);
    expect(l.releaseWrite('W1')).toEqual(['R1']);
  });
});

describe('RwLock: fair (FIFO)', () => {
  it('pembaca di belakang penulis tidak melangkahinya', () => {
    const l = lock('fair');
    expect(l.acquireRead('R1')).toBe(true);
    expect(l.acquireWrite('W1')).toBe(false);
    expect(l.acquireRead('R2')).toBe(false);
    expect(l.releaseRead('R1')).toEqual(['W1']);
    expect(l.releaseWrite('W1')).toEqual(['R2']);
  });

  it('pembaca berurutan di depan masuk bersamaan, penulis menghalangi sisanya', () => {
    const l = lock('fair');
    l.acquireWrite('W0');
    l.acquireRead('R1');
    l.acquireRead('R2');
    l.acquireWrite('W1');
    l.acquireRead('R3');
    expect(l.releaseWrite('W0')).toEqual(['R1', 'R2']);
    expect(l.releaseRead('R1')).toEqual([]);
    expect(l.releaseRead('R2')).toEqual(['W1']);
    expect(l.releaseWrite('W1')).toEqual(['R3']);
  });
});

describe('RwLock: pelanggaran penggunaan dan snapshot', () => {
  it('melepas oleh bukan pemegang melempar error jelas', () => {
    const l = lock('fair');
    expect(() => l.releaseRead('R1')).toThrow(/bukan pembaca aktif/);
    expect(() => l.releaseWrite('W1')).toThrow(/bukan penulis aktif/);
  });

  it('meminta dua kali oleh thread yang sama melempar error', () => {
    const l = lock('reader');
    l.acquireRead('R1');
    expect(() => l.acquireRead('R1')).toThrow(/sudah memegang atau mengantre/);
  });

  it('snapshot adalah salinan', () => {
    const l = lock('fair');
    l.acquireWrite('W1');
    l.acquireRead('R1');
    const snap = l.snapshot();
    snap.queue.length = 0;
    expect(l.snapshot().queue).toEqual([{ thread: 'R1', mode: 'read' }]);
  });
});
