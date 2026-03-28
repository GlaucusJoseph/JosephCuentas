const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

/** Ej.: Enero 2026 */
export function formatMonthTitleEs(month: number, year: number): string {
  const idx = Math.max(1, Math.min(12, month)) - 1;
  return `${MONTH_NAMES_ES[idx]} ${year}`;
}
