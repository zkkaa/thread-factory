import { budgetView } from '../../budgetView';

interface BudgetChipProps {
  budget: number;
  used: number;
}

/** Koin anggaran alat (PRD 17.5, Level 2-4). Teks selalu menyertai ikon koin. */
export function BudgetChip({ budget, used }: BudgetChipProps) {
  const view = budgetView(budget, used);
  if (view === null) return null;
  const text = `Sisa koin: ${view.left} / ${view.total}${view.left === 0 ? ' (habis)' : ''}`;
  return (
    <div
      role="status"
      aria-label={text}
      className="fixed left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-2 rounded border border-sun-400 bg-navy-900 px-3 py-1 text-xs text-ink-100"
    >
      <span aria-hidden="true">
        {view.coins.map((available) => (available ? '●' : '○')).join(' ')}
      </span>
      <span>{text}</span>
    </div>
  );
}
