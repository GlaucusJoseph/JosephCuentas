import {
  Currency,
  Expense,
  ExpenseType,
  Income,
  MoneyByCurrency,
  Conversion,
  MonthData,
  EXPENSE_TYPES,
  emptyExpenseTargetsCLP,
} from './models';

export interface AmountInput {
  amountOriginal: number;
  currencyOriginal: Currency;
  conversionRateToCLP?: number;
  amountOtherCurrency?: number;
  currencyOther?: Currency;
}

/**
 * Función legacy para calcular un equivalente en CLP.
 * Se mantiene por compatibilidad, pero la nueva lógica multi-moneda
 * no depende de CLP como moneda base.
 */
export function calculateAmountInCLP(input: AmountInput): number {
  const {
    amountOriginal,
    currencyOriginal,
    conversionRateToCLP,
    amountOtherCurrency,
    currencyOther,
  } = input;

  if (Number.isNaN(amountOriginal) || amountOriginal <= 0) {
    return 0;
  }

  if (currencyOriginal === 'CLP') {
    return amountOriginal;
  }

  if (conversionRateToCLP && conversionRateToCLP > 0) {
    return amountOriginal * conversionRateToCLP;
  }

  if (amountOtherCurrency && currencyOther === 'CLP') {
    return amountOtherCurrency;
  }

  return 0;
}

export function emptyMoney(): MoneyByCurrency {
  return { CLP: 0, USD: 0, ARS: 0 };
}

export function getTotalsByCurrency(
  expenses: Expense[],
  incomes: Income[],
): { incomes: MoneyByCurrency; expenses: MoneyByCurrency } {
  const incomesByCurrency = emptyMoney();
  const expensesByCurrency = emptyMoney();

  for (const inc of incomes) {
    incomesByCurrency[inc.currencyOriginal] += inc.amountOriginal;
  }

  for (const exp of expenses) {
    expensesByCurrency[exp.currencyOriginal] += exp.amountOriginal;
  }

  return { incomes: incomesByCurrency, expenses: expensesByCurrency };
}

export function getNetConversions(conversions: Conversion[]): MoneyByCurrency {
  const net = emptyMoney();

  for (const conv of conversions) {
    net[conv.fromCurrency] -= conv.fromAmount;
    const entries = Object.entries(conv.toAmounts ?? {}) as [
      keyof MoneyByCurrency,
      number | undefined,
    ][];
    for (const [currency, amount] of entries) {
      if (amount && amount > 0) {
        net[currency] += amount;
      }
    }
  }

  return net;
}

export function normalizeLegacyExpenseType(type: string): ExpenseType {
  if (type === 'SERVICIOS') return 'EXPENSAS';
  if ((EXPENSE_TYPES as readonly string[]).includes(type)) {
    return type as ExpenseType;
  }
  return 'OTROS';
}

function createEmptyTotalsByTypeByCurrency(): Record<
  ExpenseType,
  MoneyByCurrency
> {
  const baseMoney = emptyMoney();
  const totals = {} as Record<ExpenseType, MoneyByCurrency>;
  for (const t of EXPENSE_TYPES) {
    totals[t] = { ...baseMoney };
  }
  return totals;
}

export function getTotalsByTypeByCurrency(
  expenses: Expense[],
): Record<ExpenseType, MoneyByCurrency> {
  const totals = createEmptyTotalsByTypeByCurrency();

  for (const e of expenses) {
    const type = normalizeLegacyExpenseType(String(e.type));
    const bucket = totals[type];
    bucket[e.currencyOriginal] += e.amountOriginal;
  }

  return totals;
}

/**
 * Suma gastos reales por categoría en CLP (amountInCLP o calculateAmountInCLP).
 * Usar con los gastos (`expenses`) del mes correspondiente.
 */
export function getActualExpenseTotalsByTypeCLP(
  expenses: Expense[],
): Record<ExpenseType, number> {
  const totals = emptyExpenseTargetsCLP();
  for (const e of expenses) {
    const type = normalizeLegacyExpenseType(String(e.type));
    const clp = e.amountInCLP ?? calculateAmountInCLP(e);
    totals[type] += Math.max(0, clp);
  }
  return totals;
}


/**
 * Suma de metas por categoría (gasto estimado total del mes en CLP).
 */
export function sumExpenseTargetsCLP(
  targets: Record<ExpenseType, number>,
): number {
  let s = 0;
  for (const type of EXPENSE_TYPES) {
    s += Math.max(0, targets[type]);
  }
  return s;
}

export interface MonthSummary {
  incomesByCurrency: MoneyByCurrency;
  expensesByCurrency: MoneyByCurrency;
  netByCurrency: MoneyByCurrency;
  endingBalances: MoneyByCurrency;
  totalsByTypeByCurrency: Record<ExpenseType, MoneyByCurrency>;
}

export function getEndingBalances(month: MonthData): MoneyByCurrency {
  const { incomes, expenses, conversions } = month;
  const starting =
    month.startingBalances ??
    month.initialBalances ?? { CLP: 0, USD: 0, ARS: 0 };

  const { incomes: incomesByCurrency, expenses: expensesByCurrency } =
    getTotalsByCurrency(expenses, incomes ?? []);
  const netConversions = getNetConversions(conversions ?? []);

  const ending: MoneyByCurrency = emptyMoney();
  (['CLP', 'USD', 'ARS'] as const).forEach((c) => {
    ending[c] =
      starting[c] +
      incomesByCurrency[c] -
      expensesByCurrency[c] +
      netConversions[c];
  });

  return ending;
}

export function buildMonthSummary(month: MonthData): MonthSummary {
  const { incomes, expenses, conversions } = month;

  const { incomes: incomesByCurrency, expenses: expensesByCurrency } =
    getTotalsByCurrency(expenses, incomes ?? []);

  // Conversions: "from" cuenta como gasto de la moneda origen,
  // cada "to" cuenta como ingreso de la moneda destino.
  for (const conv of (conversions ?? [])) {
    expensesByCurrency[conv.fromCurrency] += conv.fromAmount;
    const entries = Object.entries(conv.toAmounts ?? {}) as [
      keyof MoneyByCurrency,
      number | undefined,
    ][];
    for (const [cur, amt] of entries) {
      if (amt && amt > 0) {
        incomesByCurrency[cur] += amt;
      }
    }
  }

  const endingBalances = getEndingBalances(month);
  const netByCurrency: MoneyByCurrency = emptyMoney();

  (['CLP', 'USD', 'ARS'] as const).forEach((c) => {
    netByCurrency[c] = incomesByCurrency[c] - expensesByCurrency[c];
  });

  const totalsByTypeByCurrency = getTotalsByTypeByCurrency(expenses);

  // Guardar endingBalances también en el mes si se desea reutilizar
  month.endingBalances = endingBalances;

  return {
    incomesByCurrency,
    expensesByCurrency,
    netByCurrency,
    endingBalances,
    totalsByTypeByCurrency,
  };
}

export interface MonthComparison {
  monthKey: string;
  incomesByCurrency: MoneyByCurrency;
  expensesByCurrency: MoneyByCurrency;
  endingBalancesByCurrency: MoneyByCurrency;
}

export function buildMonthlyComparisons(months: MonthData[]): MonthComparison[] {
  const sorted = [...months].sort((a, b) => {
    if (a.year === b.year) {
      return a.month - b.month;
    }
    return a.year - b.year;
  });

  const result: MonthComparison[] = [];

  for (let i = 0; i < sorted.length; i += 1) {
    const current = sorted[i];
    const summary = buildMonthSummary(current);

    result.push({
      monthKey: `${current.year}-${String(current.month).padStart(2, '0')}`,
      incomesByCurrency: summary.incomesByCurrency,
      expensesByCurrency: summary.expensesByCurrency,
      endingBalancesByCurrency: summary.endingBalances,
    });
  }

  return result;
}

export function findFirstExpenseOfTypePerMonth(
  months: MonthData[],
  type: ExpenseType,
): { monthKey: string; expense: Expense | null }[] {
  return months.map((m) => {
    const expense = m.expenses.find((e) => e.type === type) ?? null;
    return {
      monthKey: `${m.year}-${String(m.month).padStart(2, '0')}`,
      expense,
    };
  });
}

