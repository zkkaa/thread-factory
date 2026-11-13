import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { budgetView } from '../budgetView';
import { BudgetChip } from '../components/hud/BudgetChip';

describe('budgetView', () => {
  it('tanpa anggaran: null', () => {
    expect(budgetView(undefined, 2)).toBeNull();
  });

  it('menghitung sisa koin', () => {
    expect(budgetView(4, 1)).toEqual({
      total: 4,
      left: 3,
      coins: [true, true, true, false],
    });
  });

  it('pemakaian melebihi anggaran tidak menjadi negatif', () => {
    expect(budgetView(2, 5)?.left).toBe(0);
  });
});

describe('BudgetChip', () => {
  it('menampilkan sisa koin dengan teks dan aria-label', () => {
    const html = renderToStaticMarkup(<BudgetChip budget={4} used={1} />);
    expect(html).toContain('Sisa koin: 3 / 4');
    expect(html).toContain('aria-label="Sisa koin: 3 / 4"');
  });

  it('menandai koin habis', () => {
    const html = renderToStaticMarkup(<BudgetChip budget={4} used={4} />);
    expect(html).toContain('(habis)');
  });
});
