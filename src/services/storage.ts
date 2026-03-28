import {
  mergeExpenseTargetsCLP,
  type BudgetState,
  type MonthData,
} from '../domain/models';

const STORAGE_KEY = 'personal-expenses-v1';

function normalizeMonth(m: MonthData): MonthData {
  return {
    ...m,
    expenseTargetsCLP: mergeExpenseTargetsCLP(m.expenseTargetsCLP),
  };
}

function normalizeBudgetState(parsed: BudgetState): BudgetState {
  return {
    ...parsed,
    months: parsed.months.map((m) => normalizeMonth(m)),
  };
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadAppState(): BudgetState | undefined {
  if (!isBrowser()) {
    return undefined;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as BudgetState;

    // Normalizar meses antiguos que no tengan ingresos / conversions / balances nuevos definidos.
    const withBasics: BudgetState = {
      ...parsed,
      months: parsed.months.map((m) => ({
        ...m,
        incomes: Array.isArray((m as any).incomes)
          ? (m as any).incomes
          : [],
        conversions: Array.isArray((m as any).conversions)
          ? (m as any).conversions
          : [],
        startingBalances:
          (m as any).startingBalances ??
          (m as any).initialBalances ?? {
            CLP: 0,
            USD: 0,
            ARS: 0,
          },
      })),
    };
    return normalizeBudgetState(withBasics);
  } catch {
    return undefined;
  }
}

export function saveAppState(state: BudgetState): void {
  if (!isBrowser()) return;
  try {
    const raw = JSON.stringify(state);
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // ignore
  }
}

export function exportState(state: BudgetState): string {
  return JSON.stringify(state, null, 2);
}

export function importState(json: string): BudgetState {
  const parsed = JSON.parse(json) as BudgetState;
  const withBasics: BudgetState = {
    ...parsed,
    months: parsed.months.map((m) => ({
      ...m,
      incomes: Array.isArray((m as any).incomes)
        ? (m as any).incomes
        : [],
      conversions: Array.isArray((m as any).conversions)
        ? (m as any).conversions
        : [],
      startingBalances:
        (m as any).startingBalances ??
        (m as any).initialBalances ?? {
          CLP: 0,
          USD: 0,
          ARS: 0,
        },
    })),
  };
  return normalizeBudgetState(withBasics);
}

