import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createMemoryStorage,
  getBrowserStorage,
  safeGetItem,
  safeRemoveItem,
  safeSetItem,
} from '../storage';
import { createBrokenStorage, createFullStorage } from './fakeStorage';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createMemoryStorage', () => {
  it('menyimpan, membaca, dan menghapus', () => {
    const storage = createMemoryStorage();
    expect(storage.getItem('a')).toBeNull();
    storage.setItem('a', '1');
    expect(storage.getItem('a')).toBe('1');
    storage.removeItem('a');
    expect(storage.getItem('a')).toBeNull();
  });
});

describe('fungsi safe*', () => {
  it('bekerja normal pada penyimpanan sehat', () => {
    const storage = createMemoryStorage();
    expect(safeSetItem(storage, 'a', '1')).toBe(true);
    expect(safeGetItem(storage, 'a')).toBe('1');
    expect(safeRemoveItem(storage, 'a')).toBe(true);
  });

  it('tidak melempar error pada penyimpanan rusak', () => {
    const storage = createBrokenStorage();
    expect(safeGetItem(storage, 'a')).toBeNull();
    expect(safeSetItem(storage, 'a', '1')).toBe(false);
    expect(safeRemoveItem(storage, 'a')).toBe(false);
  });

  it('safeSetItem mengembalikan false saat kuota penuh', () => {
    expect(safeSetItem(createFullStorage(), 'a', '1')).toBe(false);
  });
});

describe('getBrowserStorage', () => {
  it('mengembalikan null bila localStorage tidak ada', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(getBrowserStorage()).toBeNull();
  });

  it('mengembalikan penyimpanan yang berfungsi', () => {
    const fake = createMemoryStorage();
    vi.stubGlobal('localStorage', fake);
    expect(getBrowserStorage()).toBe(fake);
  });

  it('mengembalikan null bila menulis gagal', () => {
    vi.stubGlobal('localStorage', createFullStorage());
    expect(getBrowserStorage()).toBeNull();
  });
});
