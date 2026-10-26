import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAutoAdvance } from '../autoAdvance';

describe('createAutoAdvance', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('memanggil onAdvance setelah waktu habis', () => {
    const onAdvance = vi.fn();
    createAutoAdvance(onAdvance, 3000);
    vi.advanceTimersByTime(2999);
    expect(onAdvance).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('skip memanggil onAdvance segera dan timer tidak menyala lagi', () => {
    const onAdvance = vi.fn();
    const advance = createAutoAdvance(onAdvance, 3000);
    advance.skip();
    expect(onAdvance).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(10_000);
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('skip berulang hanya memanggil sekali', () => {
    const onAdvance = vi.fn();
    const advance = createAutoAdvance(onAdvance, 3000);
    advance.skip();
    advance.skip();
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('cancel mencegah onAdvance, termasuk lewat skip sesudahnya', () => {
    const onAdvance = vi.fn();
    const advance = createAutoAdvance(onAdvance, 3000);
    advance.cancel();
    vi.advanceTimersByTime(10_000);
    advance.skip();
    expect(onAdvance).not.toHaveBeenCalled();
  });
});
