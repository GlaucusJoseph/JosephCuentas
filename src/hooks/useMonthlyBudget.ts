import { useMemo } from 'react';
import { useBudgetContext } from '../context/BudgetContext';
import { buildMonthSummary, findFirstExpenseOfTypePerMonth } from '../domain/calculations';
import { ExpenseType } from '../domain/models';

export function useMonthlyBudget() {
  const { state, currentMonth } = useBudgetContext();

  const monthSummary = useMemo(
    () => (currentMonth ? buildMonthSummary(currentMonth) : null),
    [currentMonth],
  );

  const firstMarketPerMonth = useMemo(
    () => findFirstExpenseOfTypePerMonth(state.months, 'MERCADO' as ExpenseType),
    [state.months],
  );

  return {
    state,
    currentMonth,
    monthSummary,
    firstMarketPerMonth,
  };
}

