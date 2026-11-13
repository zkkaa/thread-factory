export interface BudgetView {
  total: number;
  left: number;
  /** true = koin masih ada, false = sudah terpakai. */
  coins: boolean[];
}

/** Data tampilan koin anggaran alat. null bila level tanpa anggaran. */
export function budgetView(
  budget: number | undefined,
  used: number,
): BudgetView | null {
  if (budget === undefined) return null;
  const left = Math.max(0, budget - used);
  return {
    total: budget,
    left,
    coins: Array.from({ length: budget }, (_, i) => i < left),
  };
}
