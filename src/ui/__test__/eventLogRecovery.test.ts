import { describe, expect, it } from 'vitest';
import { describeEvent } from '../eventLog';

const nameOf = (id: string): string => `Teknisi ${id}`;

describe('describeEvent: pemulihan deadlock', () => {
  it('LOCK_PREEMPTED menyebut kunci dan korbannya', () => {
    const entry = describeEvent(
      { type: 'LOCK_PREEMPTED', tick: 4, thread: '1', mutex: 'kunci-1' },
      nameOf,
    );
    expect(entry.text).toContain('kunci-1');
    expect(entry.text).toContain('Teknisi 1');
    expect(entry.minor).toBe(false);
  });

  it('THREAD_ROLLED_BACK tampil sebagai kejadian penting', () => {
    const entry = describeEvent(
      { type: 'THREAD_ROLLED_BACK', tick: 4, thread: '1' },
      nameOf,
    );
    expect(entry.text).toContain('Teknisi 1');
    expect(entry.minor).toBe(false);
  });
});