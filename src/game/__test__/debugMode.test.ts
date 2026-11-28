import { describe, expect, it } from 'vitest';
import { isDebugArena } from '../debugMode';

describe('isDebugArena', () => {
  it('aktif bila ada parameter debug', () => {
    expect(isDebugArena('?debug')).toBe(true);
    expect(isDebugArena('?a=1&debug=1')).toBe(true);
  });

  it('mati tanpa parameter debug', () => {
    expect(isDebugArena('')).toBe(false);
    expect(isDebugArena('?level=1-3')).toBe(false);
  });
});