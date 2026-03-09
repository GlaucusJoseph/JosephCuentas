import {
  Currency,
  Expense,
  ExpenseType,
  Income,
  MoneyByCurrency,
  Conversion,
  MonthData,
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

export function getTotalsByTypeByCurrency(
  expenses: Expense[],
): Record<ExpenseType, MoneyByCurrency> {
  const baseMoney = emptyMoney();
  const totals: Record<ExpenseType, MoneyByCurrency> = {
    MERCADO: { ...baseMoney },
    ARRIENDO: { ...baseMoney },
    SERVICIOS: { ...baseMoney },
    TRANSPORTE: { ...baseMoney },
    OTROS: { ...baseMoney },
  };

  for (const e of expenses) {
    const bucket = totals[e.type];
    bucket[e.currencyOriginal] += e.amountOriginal;
  }

  return totals;
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
  netByCurrency: MoneyByCurrency;
  diffPrevNetByCurrency: {
    CLP: number | null;
    USD: number | null;
    ARS: number | null;
  };
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
    const currentSummary = buildMonthSummary(current);
    const prev = sorted[i - 1];

    const netByCurrency = currentSummary.netByCurrency;
    const diffPrevNetByCurrency = {
      CLP: null as number | null,
      USD: null as number | null,
      ARS: null as number | null,
    };

    if (prev) {
      const prevSummary = buildMonthSummary(prev);
      (['CLP', 'USD', 'ARS'] as const).forEach((c) => {
        diffPrevNetByCurrency[c] =
          netByCurrency[c] - prevSummary.netByCurrency[c];
      });
    }

    result.push({
      monthKey: `${current.year}-${String(current.month).padStart(2, '0')}`,
      netByCurrency,
      diffPrevNetByCurrency,
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

