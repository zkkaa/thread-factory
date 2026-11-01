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

  it('pause menahan hitungan dan resume melanjutkan dari sisa waktu', () => {
    const onAdvance = vi.fn();
    const advance = createAutoAdvance(onAdvance, 3000);
    vi.advanceTimersByTime(1000);
    advance.pause();
    vi.advanceTimersByTime(10_000);
    expect(onAdvance).not.toHaveBeenCalled();
    advance.resume();
    vi.advanceTimersByTime(1999);
    expect(onAdvance).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('pause dan resume berulang tidak menggandakan panggilan', () => {
    const onAdvance = vi.fn();
    const advance = createAutoAdvance(onAdvance, 3000);
    advance.pause();
    advance.pause();
    advance.resume();
    advance.resume();
    vi.advanceTimersByTime(3000);
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('resume tanpa pause tidak mengubah jadwal', () => {
    const onAdvance = vi.fn();
    const advance = createAutoAdvance(onAdvance, 3000);
    vi.advanceTimersByTime(2000);
    advance.resume();
    vi.advanceTimersByTime(1000);
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('skip saat dijeda tetap melanjutkan, dan pause setelah selesai diabaikan', () => {
    const onAdvance = vi.fn();
    const advance = createAutoAdvance(onAdvance, 3000);
    advance.pause();
    advance.skip();
    expect(onAdvance).toHaveBeenCalledTimes(1);
    advance.pause();
    advance.resume();
    vi.advanceTimersByTime(10_000);
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });
});
