import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  BudgetState,
  Currency,
  Expense,
  ExpenseType,
  Income,
  IncomeType,
  MonthData,
  getMonthKey,
  Conversion,
  MoneyByCurrency,
  mergeExpenseTargetsCLP,
} from '../domain/models';
import { calculateAmountInCLP } from '../domain/calculations';
import {
  addExpenseToMonth,
  removeExpenseFromMonth,
  updateExpenseInMonth,
  addIncomeToMonth,
  removeIncomeFromMonth,
  updateIncomeInMonth,
  ensureMonth,
  updateBalancesForMonth,
  addConversionToMonth,
  removeConversionFromMonth,
  updateConversionInMonth,
  updateBudgetPlanningForMonth,
} from '../services/monthRepository';
import {
  exportState,
  importState,
  loadAppState,
  saveAppState,
} from '../services/storage';

interface AddExpenseInput {
  date: string;
  type: ExpenseType;
  amountOriginal: number;
  currencyOriginal: Currency;
  conversionRateToCLP?: number;
  amountOtherCurrency?: number;
  currencyOther?: Currency;
  note?: string;
}

interface AddIncomeInput {
  date: string;
  type: IncomeType;
  amountOriginal: number;
  currencyOriginal: Currency;
  conversionRateToCLP?: number;
  amountOtherCurrency?: number;
  currencyOther?: Currency;
  note?: string;
}

interface UpdateBalancesInput {
  monthKey: string;
  clp?: number;
  usd?: number;
  ars?: number;
}

interface AddConversionInput {
  date?: string;
  fromCurrency: Currency;
  fromAmount: number;
  toCLP?: number;
  toUSD?: number;
  toARS?: number;
  note?: string;
}

interface BudgetContextValue {
  state: BudgetState;
  currentMonth: MonthData | undefined;
  selectMonth: (key: string) => void;
  addExpense: (monthKey: string, input: AddExpenseInput) => void;
  addIncome: (monthKey: string, input: AddIncomeInput) => void;
  removeExpense: (monthKey: string, id: string) => void;
  removeIncome: (monthKey: string, id: string) => void;
  updateExpense: (monthKey: string, id: string, input: AddExpenseInput) => void;
  updateIncome: (monthKey: string, id: string, input: AddIncomeInput) => void;
  addConversion: (monthKey: string, input: AddConversionInput) => void;
  removeConversion: (monthKey: string, id: string) => void;
  updateConversion: (
    monthKey: string,
    id: string,
    input: AddConversionInput,
  ) => void;
  updateBalances: (input: UpdateBalancesInput) => void;
  createMonthIfNotExists: (year: number, month: number) => void;
  updateBudgetPlanning: (
    monthKey: string,
    targets: Record<ExpenseType, number>,
    initialBudgetCLP: number,
  ) => void;
  exportStateJson: () => string;
  importStateJson: (json: string) => void;
}

const BudgetContext = createContext<BudgetContextValue | undefined>(undefined);

function createInitialState(): BudgetState {
  const loaded = loadAppState();
  if (loaded && loaded.months.length > 0) {
    return loaded;
  }

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const key = getMonthKey(year, month);

  const emptyMonth: MonthData = {
    year,
    month,
    startingBalances: { CLP: 0, USD: 0, ARS: 0 },
    endingBalances: { CLP: 0, USD: 0, ARS: 0 },
    expenses: [],
    incomes: [],
    conversions: [],
    expenseTargetsCLP: mergeExpenseTargetsCLP(undefined),
    initialBudgetCLP: 0,
    // legacy
    initialBalances: { CLP: 0, USD: 0, ARS: 0 },
    currentBalances: { CLP: 0, USD: 0, ARS: 0 },
  };

  return {
    selectedMonthKey: key,
    months: [emptyMonth],
  };
}

export const BudgetProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, setState] = useState<BudgetState>(() => createInitialState());

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  const currentMonth: MonthData | undefined = useMemo(
    () =>
      state.months.find(
        (m) => getMonthKey(m.year, m.month) === state.selectedMonthKey,
      ),
    [state],
  );

  const selectMonth = (key: string) => {
    setState((prev) => ({
      ...prev,
      selectedMonthKey: key,
    }));
  };

  const createMonthIfNotExists = (year: number, month: number) => {
    setState((prev) => ensureMonth(prev, year, month));
  };

  const addExpense = (monthKey: string, input: AddExpenseInput) => {
    const amountInCLP = calculateAmountInCLP(input);
    const expense: Expense = {
      id: `${monthKey}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: input.date,
      type: input.type,
      amountOriginal: input.amountOriginal,
      currencyOriginal: input.currencyOriginal,
      conversionRateToCLP: input.conversionRateToCLP,
      amountOtherCurrency: input.amountOtherCurrency,
      currencyOther: input.currencyOther,
      amountInCLP,
      note: input.note,
    };

    setState((prev) => addExpenseToMonth(prev, monthKey, expense));
  };

  const updateBalances = (input: UpdateBalancesInput) => {
    const { monthKey, clp, usd, ars } = input;
    setState((prev) =>
      updateBalancesForMonth(prev, monthKey, {
        CLP:
          clp ??
          prev.months[0]?.currentBalances?.CLP ??
          0,
        USD:
          usd ??
          prev.months[0]?.currentBalances?.USD ??
          0,
        ARS:
          ars ??
          prev.months[0]?.currentBalances?.ARS ??
          0,
      }),
    );
  };

  const exportStateJson = () => exportState(state);

  const importStateJson = (json: string) => {
    const next = importState(json);
    setState(next);
  };

  const value: BudgetContextValue = {
    state,
    currentMonth,
    selectMonth,
    addExpense,
    addIncome: (monthKey, input) => {
      const amountInCLP = calculateAmountInCLP(input);
      const income: Income = {
        id: `${monthKey}-INC-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        date: input.date,
        type: input.type,
        amountOriginal: input.amountOriginal,
        currencyOriginal: input.currencyOriginal,
        conversionRateToCLP: input.conversionRateToCLP,
        amountOtherCurrency: input.amountOtherCurrency,
        currencyOther: input.currencyOther,
        amountInCLP,
        note: input.note,
      };
      setState((prev) => addIncomeToMonth(prev, monthKey, income));
    },
    removeExpense: (monthKey, id) => {
      setState((prev) => removeExpenseFromMonth(prev, monthKey, id));
    },
    removeIncome: (monthKey, id) => {
      setState((prev) => removeIncomeFromMonth(prev, monthKey, id));
    },
    updateExpense: (monthKey, id, input) => {
      const amountInCLP = calculateAmountInCLP(input);
      const expense: Expense = {
        id,
        date: input.date,
        type: input.type,
        amountOriginal: input.amountOriginal,
        currencyOriginal: input.currencyOriginal,
        conversionRateToCLP: input.conversionRateToCLP,
        amountOtherCurrency: input.amountOtherCurrency,
        currencyOther: input.currencyOther,
        amountInCLP,
        note: input.note,
      };
      setState((prev) => updateExpenseInMonth(prev, monthKey, id, expense));
    },
    updateIncome: (monthKey, id, input) => {
      const amountInCLP = calculateAmountInCLP(input);
      const income: Income = {
        id,
        date: input.date,
        type: input.type,
        amountOriginal: input.amountOriginal,
        currencyOriginal: input.currencyOriginal,
        conversionRateToCLP: input.conversionRateToCLP,
        amountOtherCurrency: input.amountOtherCurrency,
        currencyOther: input.currencyOther,
        amountInCLP,
        note: input.note,
      };
      setState((prev) => updateIncomeInMonth(prev, monthKey, id, income));
    },
    addConversion: (monthKey, input) => {
      const toAmounts: Partial<MoneyByCurrency> = {};
      if (input.toCLP && input.toCLP > 0) toAmounts.CLP = input.toCLP;
      if (input.toUSD && input.toUSD > 0) toAmounts.USD = input.toUSD;
      if (input.toARS && input.toARS > 0) toAmounts.ARS = input.toARS;

      const conversion: Conversion = {
        id: `${monthKey}-CONV-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        fromCurrency: input.fromCurrency,
        fromAmount: input.fromAmount,
        toAmounts,
        date: input.date,
        note: input.note,
      };
      setState((prev) => addConversionToMonth(prev, monthKey, conversion));
    },
    removeConversion: (monthKey, id) => {
      setState((prev) => removeConversionFromMonth(prev, monthKey, id));
    },
    updateConversion: (monthKey, id, input) => {
      const toAmounts: Partial<MoneyByCurrency> = {};
      if (input.toCLP && input.toCLP > 0) toAmounts.CLP = input.toCLP;
      if (input.toUSD && input.toUSD > 0) toAmounts.USD = input.toUSD;
      if (input.toARS && input.toARS > 0) toAmounts.ARS = input.toARS;

      const conversion: Conversion = {
        id,
        fromCurrency: input.fromCurrency,
        fromAmount: input.fromAmount,
        toAmounts,
        date: input.date,
        note: input.note,
      };
      setState((prev) =>
        updateConversionInMonth(prev, monthKey, id, conversion),
      );
    },
    updateBalances,
    createMonthIfNotExists,
    updateBudgetPlanning: (monthKey, targets, initialBudgetCLP) => {
      setState((prev) =>
        updateBudgetPlanningForMonth(prev, monthKey, targets, initialBudgetCLP),
      );
    },
    exportStateJson,
    importStateJson,
  };

  return (
    <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
  );
};

export function useBudgetContext(): BudgetContextValue {
  const ctx = useContext(BudgetContext);
  if (!ctx) {
    throw new Error('useBudgetContext must be used within BudgetProvider');
  }
  return ctx;
}

