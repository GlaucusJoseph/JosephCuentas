/** Objetivo: familia verde; variación por sector. */
export function fillObjectiveSequence(index: number, total: number): string {
  if (total <= 0) return 'hsl(142 65% 42%)';
  const t = total <= 1 ? 0 : index / (total - 1);
  const h = 142 - t * 48;
  const s = 62 + t * 12;
  const l = 38 + t * 10;
  return `hsl(${h} ${s}% ${l}%)`;
}

/** Actual: familia azul/cian; distinta del donut Objetivo. */
export function fillActualSequence(index: number, total: number): string {
  if (total <= 0) return 'hsl(199 75% 48%)';
  const t = total <= 1 ? 0 : index / (total - 1);
  const h = 199 + t * 42;
  const s = 58 + t * 18;
  const l = 36 + t * 12;
  return `hsl(${h} ${s}% ${l}%)`;
}

export const GAP_COLOR = '#1e293b';

export const TOOLTIP_UNDER_COLOR = '#4ade80';
export const TOOLTIP_OVER_COLOR = '#f87171';
