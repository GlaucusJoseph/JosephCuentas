import {
  BudgetState,
  Expense,
  ExpenseType,
  Income,
  MonthData,
  MoneyByCurrency,
  Conversion,
  getMonthKey,
  mergeExpenseTargetsCLP,
} from '../domain/models';

function cloneState(state: BudgetState): BudgetState {
  const zeroBalances: MoneyByCurrency = { CLP: 0, USD: 0, ARS: 0 };
  return {
    selectedMonthKey: state.selectedMonthKey,
    months: state.months.map((m) => ({
      ...m,
      expenses: m.expenses.map((e) => ({ ...e })),
      incomes: (m.incomes ?? []).map((i) => ({ ...i })),
      startingBalances: {
        ...(m.startingBalances ??
          m.initialBalances ??
          zeroBalances),
      },
      endingBalances: m.endingBalances
        ? { ...m.endingBalances }
        : undefined,
      conversions: (m.conversions ?? []).map(
        (c: Conversion) => ({ ...c }),
      ),
      // legacy
      initialBalances: m.initialBalances
        ? { ...m.initialBalances }
        : zeroBalances,
      currentBalances: m.currentBalances
        ? { ...m.currentBalances }
        : zeroBalances,
      expenseTargetsCLP: mergeExpenseTargetsCLP(m.expenseTargetsCLP),
    })),
  };
}

export function getMonth(
  state: BudgetState,
  key: string,
): MonthData | undefined {
  return state.months.find(
    (m) => getMonthKey(m.year, m.month) === key,
  );
}

export function upsertMonth(
  state: BudgetState,
  month: MonthData,
): BudgetState {
  const next = cloneState(state);
  const key = getMonthKey(month.year, month.month);
  const idx = next.months.findIndex(
    (m) => getMonthKey(m.year, m.month) === key,
  );

  if (idx === -1) {
    next.months.push(month);
  } else {
    next.months[idx] = month;
  }

  return next;
}

export function addExpenseToMonth(
  state: BudgetState,
  key: string,
  expense: Expense,
): BudgetState {
  const existing = getMonth(state, key);
  if (!existing) return state;
  const updated: MonthData = {
    ...existing,
    expenses: [...existing.expenses, expense],
  };
  return upsertMonth(state, updated);
}

export function removeExpenseFromMonth(
  state: BudgetState,
  key: string,
  expenseId: string,
): BudgetState {
  const existing = getMonth(state, key);
  if (!existing) return state;
  const updated: MonthData = {
    ...existing,
    expenses: existing.expenses.filter((e) => e.id !== expenseId),
  };
  return upsertMonth(state, updated);
}

export function updateExpenseInMonth(
  state: BudgetState,
  key: string,
  expenseId: string,
  expense: Expense,
): BudgetState {
  const existing = getMonth(state, key);
  if (!existing) return state;
  const idx = existing.expenses.findIndex((e) => e.id === expenseId);
  if (idx === -1) return state;
  const expenses = [...existing.expenses];
  expenses[idx] = expense;
  const updated: MonthData = { ...existing, expenses };
  return upsertMonth(state, updated);
}

export function addIncomeToMonth(
  state: BudgetState,
  key: string,
  income: Income,
): BudgetState {
  const existing = getMonth(state, key);
  if (!existing) return state;
  const updated: MonthData = {
    ...existing,
    incomes: [...(existing.incomes ?? []), income],
  };
  return upsertMonth(state, updated);
}

export function removeIncomeFromMonth(
  state: BudgetState,
  key: string,
  incomeId: string,
): BudgetState {
  const existing = getMonth(state, key);
  if (!existing) return state;
  const updated: MonthData = {
    ...existing,
    incomes: (existing.incomes ?? []).filter((i) => i.id !== incomeId),
  };
  return upsertMonth(state, updated);
}

export function updateIncomeInMonth(
  state: BudgetState,
  key: string,
  incomeId: string,
  income: Income,
): BudgetState {
  const existing = getMonth(state, key);
  if (!existing) return state;
  const incomes = existing.incomes ?? [];
  const idx = incomes.findIndex((i) => i.id === incomeId);
  if (idx === -1) return state;
  const next = [...incomes];
  next[idx] = income;
  const updated: MonthData = { ...existing, incomes: next };
  return upsertMonth(state, updated);
}

export function addConversionToMonth(
  state: BudgetState,
  key: string,
  conversion: Conversion,
): BudgetState {
  const existing = getMonth(state, key);
  if (!existing) return state;
  const updated: MonthData = {
    ...existing,
    conversions: [...(existing.conversions ?? []), conversion],
  };
  return upsertMonth(state, updated);
}

export function removeConversionFromMonth(
  state: BudgetState,
  key: string,
  conversionId: string,
): BudgetState {
  const existing = getMonth(state, key);
  if (!existing) return state;
  const updated: MonthData = {
    ...existing,
    conversions: (existing.conversions ?? []).filter(
      (c) => c.id !== conversionId,
    ),
  };
  return upsertMonth(state, updated);
}

export function updateConversionInMonth(
  state: BudgetState,
  key: string,
  conversionId: string,
  conversion: Conversion,
): BudgetState {
  const existing = getMonth(state, key);
  if (!existing) return state;
  const conversions = existing.conversions ?? [];
  const idx = conversions.findIndex((c) => c.id === conversionId);
  if (idx === -1) return state;
  const next = [...conversions];
  next[idx] = conversion;
  const updated: MonthData = { ...existing, conversions: next };
  return upsertMonth(state, updated);
}

export function updateBalancesForMonth(
  state: BudgetState,
  key: string,
  balances: Partial<MoneyByCurrency>,
): BudgetState {
  const existing = getMonth(state, key);
  if (!existing) return state;

  const current =
    existing.currentBalances ?? ({ CLP: 0, USD: 0, ARS: 0 } as MoneyByCurrency);

  const updated: MonthData = {
    ...existing,
    currentBalances: {
      ...current,
      ...balances,
    },
  };

  return upsertMonth(state, updated);
}

export function ensureMonth(
  state: BudgetState,
  year: number,
  month: number,
): BudgetState {
  const key = getMonthKey(year, month);
  const existing = getMonth(state, key);
  if (existing) return state;

  const zeroBalances: MoneyByCurrency = { CLP: 0, USD: 0, ARS: 0 };

  const emptyMonth: MonthData = {
    year,
    month,
    startingBalances: zeroBalances,
    endingBalances: zeroBalances,
    expenses: [],
    incomes: [],
    conversions: [],
    expenseTargetsCLP: mergeExpenseTargetsCLP(undefined),
    initialBudgetCLP: 0,
    // legacy
    initialBalances: zeroBalances,
    currentBalances: zeroBalances,
  };

  const next = cloneState(state);
  next.months.push(emptyMonth);
  return next;
}

export function updateBudgetPlanningForMonth(
  state: BudgetState,
  key: string,
  targets: Record<ExpenseType, number>,
  initialBudgetCLP: number,
): BudgetState {
  const existing = getMonth(state, key);
  if (!existing) return state;
  const safeBase =
    Number.isFinite(initialBudgetCLP) && initialBudgetCLP >= 0
      ? initialBudgetCLP
      : 0;
  const updated: MonthData = {
    ...existing,
    expenseTargetsCLP: mergeExpenseTargetsCLP(targets),
    initialBudgetCLP: safeBase,
  };
  return upsertMonth(state, updated);
}

