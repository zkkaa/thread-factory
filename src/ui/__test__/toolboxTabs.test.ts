import { describe, expect, it } from 'vitest';
import { resolveActiveTab } from '../toolboxTabs';

const TABS = [
  { id: 'mutex', label: 'Pintu Mutex' },
  { id: 'semaphore', label: 'Kartu Akses' },
];

describe('resolveActiveTab', () => {
  it('tanpa tab mengembalikan null', () => {
    expect(resolveActiveTab([], null)).toBeNull();
  });

  it('tanpa pilihan memakai tab pertama', () => {
    expect(resolveActiveTab(TABS, null)).toBe('mutex');
  });

  it('memakai pilihan pemain bila ada', () => {
    expect(resolveActiveTab(TABS, 'semaphore')).toBe('semaphore');
  });

  it('pilihan yang sudah tidak ada jatuh ke tab pertama', () => {
    expect(resolveActiveTab(TABS, 'condition')).toBe('mutex');
  });
});
