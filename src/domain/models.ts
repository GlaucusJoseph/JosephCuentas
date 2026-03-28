export type Currency = "CLP" | "USD" | "ARS";

/**
 * Única fuente de verdad: orden en UI y etiquetas.
 * El tipo `ExpenseType` se deriva de aquí para no duplicar listas.
 */
export const EXPENSE_TYPE_CONFIG = [
  { type: "ARRIENDO" as const, label: "Arriendo" },
  { type: "MERCADO" as const, label: "Mercado" },
  { type: "INTERNET" as const, label: "Internet" },
  { type: "TELEFONO" as const, label: "Teléfono" },
  { type: "AGUA" as const, label: "Agua" },
  { type: "LUZ" as const, label: "Luz" },
  { type: "GAS" as const, label: "Gas" },
  { type: "EXPENSAS" as const, label: "Expensas" },
  { type: "OTROS" as const, label: "Otros" },
  { type: "TRANSPORTE" as const, label: "Transporte" },
  { type: "FUTBOL" as const, label: "Fútbol" },
] as const;

export type ExpenseType = (typeof EXPENSE_TYPE_CONFIG)[number]["type"];

export const EXPENSE_TYPES: readonly ExpenseType[] = EXPENSE_TYPE_CONFIG.map(
  (c) => c.type,
);

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = Object.fromEntries(
  EXPENSE_TYPE_CONFIG.map((c) => [c.type, c.label]),
) as Record<ExpenseType, string>;

export function emptyExpenseTargetsCLP(): Record<ExpenseType, number> {
  return Object.fromEntries(EXPENSE_TYPES.map((t) => [t, 0])) as Record<
    ExpenseType,
    number
  >;
}

export function mergeExpenseTargetsCLP(
  raw: Partial<Record<ExpenseType, number>> | undefined,
): Record<ExpenseType, number> {
  const base = emptyExpenseTargetsCLP();
  if (!raw) return base;
  for (const t of EXPENSE_TYPES) {
    const v = raw[t];
    if (typeof v === "number" && !Number.isNaN(v)) {
      base[t] = Math.max(0, v);
    }
  }
  return base;
}

export type IncomeType = "SUELDO" | "BONO" | "OTROS_INGRESOS";

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
   * Meta de gasto por categoría en CLP (presupuesto deseado del mes).
   */
  expenseTargetsCLP: Record<ExpenseType, number>;
  /**
   * Presupuesto base del mes en CLP (valor inicial).
   */
  initialBudgetCLP?: number;
  /**
   * Campos legacy para compatibilidad con datos previos al rediseño
   * multi-moneda.
   */
  initialBalances?: MoneyByCurrency;
  currentBalances?: MoneyByCurrency;
}

export interface BudgetState {
  months: MonthData[];
  selectedMonthKey: string;
}

export function getMonthKey(year: number, month: number): string {
  const m = String(month).padStart(2, "0");
  return `${year}-${m}`;
}
