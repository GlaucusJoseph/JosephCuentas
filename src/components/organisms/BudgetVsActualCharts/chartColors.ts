/** Verde base; los siguientes sectores se desplazan ligeramente en tono. */
export function fillGreenSequence(index: number, total: number): string {
  if (total <= 0) return 'hsl(142 65% 42%)';
  const t = total <= 1 ? 0 : index / (total - 1);
  const h = 142 - t * 48;
  const s = 62 + t * 12;
  const l = 38 + t * 10;
  return `hsl(${h} ${s}% ${l}%)`;
}

export const GAP_COLOR = '#1e293b';
export const OVER_BUDGET_COLOR = '#dc2626';
