/** Logika petunjuk bertahap (murni). Jumlah kegagalan dihitung per sesi Arena. */
export const FAILURES_BEFORE_OFFER = 2;

export interface HintState {
  failures: number;
  revealed: number;
}

export const INITIAL_HINT_STATE: HintState = { failures: 0, revealed: 0 };

export function recordFailure(state: HintState): HintState {
  return { ...state, failures: state.failures + 1 };
}

export function revealNext(state: HintState, total: number): HintState {
  return { ...state, revealed: Math.min(state.revealed + 1, total) };
}

/** Tombol Petunjuk di popup hasil muncul setelah 2 kegagalan. */
export function shouldOfferHint(state: HintState): boolean {
  return state.failures >= FAILURES_BEFORE_OFFER;
}

export function visibleHints(
  hints: readonly string[],
  state: HintState,
): string[] {
  return hints.slice(0, state.revealed);
}

export function hasMoreHints(
  hints: readonly string[],
  state: HintState,
): boolean {
  return state.revealed < hints.length;
}
