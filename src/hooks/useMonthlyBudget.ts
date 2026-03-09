import { useMemo } from 'react';
import { useBudgetContext } from '../context/BudgetContext';
import { buildMonthSummary, buildMonthlyComparisons, findFirstExpenseOfTypePerMonth } from '../domain/calculations';
import { ExpenseType, getMonthKey } from '../domain/models';

export function useMonthlyBudget() {
  const { state, currentMonth } = useBudgetContext();

  const monthSummary = useMemo(
    () => (currentMonth ? buildMonthSummary(currentMonth) : null),
    [currentMonth],
  );

  const comparisons = useMemo(
    () => buildMonthlyComparisons(state.months),
    [state.months],
  );

  const firstMarketPerMonth = useMemo(
    () => findFirstExpenseOfTypePerMonth(state.months, 'MERCADO' as ExpenseType),
    [state.months],
  );

  const monthOptions = useMemo(
    () =>
      state.months
        .slice()
        .sort((a, b) => {
          if (a.year === b.year) return a.month - b.month;
          return a.year - b.year;
        })
        .map((m) => ({
          key: getMonthKey(m.year, m.month),
          label: `${m.month.toString().padStart(2, '0')}/${m.year}`,
        })),
    [state.months],
  );

  return {
    state,
    currentMonth,
    monthSummary,
    comparisons,
    firstMarketPerMonth,
    monthOptions,
  };
}

