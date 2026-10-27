import { describe, expect, it } from 'vitest';
import {
  INITIAL_HINT_STATE,
  hasMoreHints,
  recordFailure,
  revealNext,
  shouldOfferHint,
  visibleHints,
} from '../hints';

const HINTS = ['a', 'b', 'c'];

describe('hints', () => {
  it('menawarkan petunjuk setelah 2 kegagalan', () => {
    const one = recordFailure(INITIAL_HINT_STATE);
    expect(shouldOfferHint(one)).toBe(false);
    expect(shouldOfferHint(recordFailure(one))).toBe(true);
  });

  it('membuka petunjuk satu per satu dan berhenti di akhir', () => {
    let s = INITIAL_HINT_STATE;
    expect(visibleHints(HINTS, s)).toEqual([]);
    s = revealNext(s, HINTS.length);
    expect(visibleHints(HINTS, s)).toEqual(['a']);
    expect(hasMoreHints(HINTS, s)).toBe(true);
    s = revealNext(revealNext(revealNext(s, 3), 3), 3);
    expect(visibleHints(HINTS, s)).toEqual(HINTS);
    expect(hasMoreHints(HINTS, s)).toBe(false);
  });

  it('tidak membuka apa pun bila tidak ada petunjuk', () => {
    expect(revealNext(INITIAL_HINT_STATE, 0).revealed).toBe(0);
  });

  it('tidak mengubah state masukan', () => {
    recordFailure(INITIAL_HINT_STATE);
    expect(INITIAL_HINT_STATE).toEqual({ failures: 0, revealed: 0 });
  });
});
