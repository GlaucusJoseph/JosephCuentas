export type Currency = 'CLP' | 'USD' | 'ARS';

export type ExpenseType =
  | 'MERCADO'
  | 'ARRIENDO'
  | 'SERVICIOS'
  | 'TRANSPORTE'
  | 'OTROS';

export type IncomeType =
  | 'SUELDO'
  | 'BONO'
  | 'OTROS_INGRESOS';

export interface MoneyByCurrency {
  CLP: number;
  USD: number;
  ARS: number;
}

export interface Expense {
  id: string;
  date: string; // ISO string yyyy-mm-dd
  type: ExpenseType;
  amountOriginal: number;
  currencyOriginal: Currency;
  /**
   * Campos legacy relacionados con conversiones a CLP.
   * Se mantienen para compatibilidad con datos antiguos,
   * pero la nueva lógica multi-moneda no depende de ellos.
   */
  conversionRateToCLP?: number;
  amountOtherCurrency?: number;
  currencyOther?: Currency;
  amountInCLP?: number;
  note?: string;
}

export interface Income {
  id: string;
  date: string; // ISO string yyyy-mm-dd
  type: IncomeType;
  amountOriginal: number;
  currencyOriginal: Currency;
  /**
   * Campos legacy relacionados con conversiones a CLP.
   * Se mantienen para compatibilidad con datos antiguos,
   * pero la nueva lógica multi-moneda no depende de ellos.
   */
  conversionRateToCLP?: number;
  amountOtherCurrency?: number;
  currencyOther?: Currency;
  amountInCLP?: number;
  note?: string;
}

export interface Conversion {
  id: string;
  fromCurrency: Currency;
  fromAmount: number;
  toAmounts: Partial<MoneyByCurrency>;
  /**
   * Fecha del cambio de divisa (ISO yyyy-mm-dd).
   * Opcional para mantener compatibilidad con datos antiguos.
   */
  date?: string;
  /**
   * Comentario descriptivo del cambio de divisa.
   */
  note?: string;
}

export interface MonthData {
  year: number;
  month: number; // 1-12
  /**
   * Saldos con los que se comienza el mes, por moneda.
   */
  startingBalances: MoneyByCurrency;
  /**
   * Saldos calculados al final del mes. Puede omitirse si se calcula
   * dinámicamente a partir de movimientos y conversiones.
   */
  endingBalances?: MoneyByCurrency;
  expenses: Expense[];
  incomes: Income[];
  conversions: Conversion[];
  /**
   * Campos legacy para compatibilidad con datos previos al rediseño
   * multi-moneda. No se usan en los nuevos cálculos.
   */
  initialBudgetCLP?: number;
  initialBalances?: MoneyByCurrency;
  currentBalances?: MoneyByCurrency;
}

export interface BudgetState {
  months: MonthData[];
  selectedMonthKey: string;
}

export function getMonthKey(year: number, month: number): string {
  const m = String(month).padStart(2, '0');
  return `${year}-${m}`;
}

