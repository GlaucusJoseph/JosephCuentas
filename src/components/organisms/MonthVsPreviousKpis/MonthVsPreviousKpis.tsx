import React, { useMemo } from 'react';
import { useBudgetContext } from '../../../context/BudgetContext';
import { buildMonthSummary } from '../../../domain/calculations';
import { Currency, getMonthKey } from '../../../domain/models';
import { formatMonthTitleEs } from '../../../domain/dateLabels';
import styles from './MonthVsPreviousKpis.module.css';

const CURRENCIES: Currency[] = ['CLP', 'USD', 'ARS'];

function formatMoney(value: number, currency: Currency): string {
  const opts: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'USD' ? 2 : 0,
  };
  const locale =
    currency === 'ARS' ? 'es-AR' : currency === 'USD' ? 'en-US' : 'es-CL';
  return new Intl.NumberFormat(locale, opts).format(value);
}

function formatPct(curr: number, prev: number): string {
  if (prev === 0) {
    if (curr === 0) return '0%';
    return '—';
  }
  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

type ExpenseTone = 'good' | 'bad' | 'neutral';

function expensePctTone(curr: number, prev: number): ExpenseTone {
  if (curr === prev) return 'neutral';
  if (curr < prev) return 'good';
  return 'bad';
}

function balancePctTone(curr: number, prev: number): ExpenseTone {
  if (curr === prev) return 'neutral';
  if (curr > prev) return 'good';
  return 'bad';
}

function incomePctTone(curr: number, prev: number): ExpenseTone {
  if (curr === prev) return 'neutral';
  if (curr > prev) return 'good';
  return 'bad';
}

function PctCell({
  tone,
  text,
}: {
  tone: ExpenseTone;
  text: string;
}) {
  const muted = text === '—';
  return (
    <span
      className={muted ? styles.pctMuted : `${styles.pct} ${styles[tone]}`}
    >
      {text}
    </span>
  );
}

interface Props {
  monthKey: string;
}

export const MonthVsPreviousKpis: React.FC<Props> = ({ monthKey }) => {
  const { state } = useBudgetContext();

  const sorted = useMemo(
    () =>
      [...state.months].sort((a, b) => {
        if (a.year === b.year) return a.month - b.month;
        return a.year - b.year;
      }),
    [state.months],
  );

  const { current, prev, prevLabel } = useMemo(() => {
    const idx = sorted.findIndex(
      (m) => getMonthKey(m.year, m.month) === monthKey,
    );
    if (idx < 0) {
      return { current: null, prev: null, prevLabel: null as string | null };
    }
    const cur = sorted[idx];
    const p = idx > 0 ? sorted[idx - 1] : null;
    return {
      current: cur,
      prev: p,
      prevLabel: p
        ? formatMonthTitleEs(p.month, p.year)
        : null,
    };
  }, [sorted, monthKey]);

  const curSummary = useMemo(
    () => (current ? buildMonthSummary(current) : null),
    [current],
  );
  const prevSummary = useMemo(
    () => (prev ? buildMonthSummary(prev) : null),
    [prev],
  );

  if (!current || !curSummary) {
    return null;
  }

  const monthTitle = formatMonthTitleEs(current.month, current.year);

  return (
    <section className={styles.wrap} aria-labelledby="mom-kpis-title">
      <h2 id="mom-kpis-title" className={styles.title}>
        Comparación con el mes anterior
      </h2>
      <p className={styles.sub}>
        Mes actual: <strong>{monthTitle}</strong>
        {prevLabel ? (
          <>
            {' '}
            · Referencia: <strong>{prevLabel}</strong>
          </>
        ) : (
          <span className={styles.noPrev}> · No hay mes anterior cargado</span>
        )}
      </p>

      <div className={styles.grid}>
        {CURRENCIES.map((c) => {
          const inc = curSummary.incomesByCurrency[c];
          const exp = curSummary.expensesByCurrency[c];
          const sal = curSummary.endingBalances[c];
          const pInc = prevSummary?.incomesByCurrency[c];
          const pExp = prevSummary?.expensesByCurrency[c];
          const pSal = prevSummary?.endingBalances[c];

          const hasPrev = prevSummary != null;

          return (
            <div key={c} className={styles.currencyBlock}>
              <div className={styles.currencyLabel}>{c}</div>

              <div className={styles.metric}>
                <span className={styles.metricName}>Ingreso</span>
                <span className={styles.metricVal}>
                  {formatMoney(inc, c)}
                </span>
                {hasPrev && pInc !== undefined ? (
                  <PctCell
                    tone={incomePctTone(inc, pInc)}
                    text={formatPct(inc, pInc)}
                  />
                ) : (
                  <span className={styles.pctMuted}>—</span>
                )}
              </div>

              <div className={styles.metric}>
                <span className={styles.metricName}>Gasto</span>
                <span className={styles.metricVal}>
                  {formatMoney(exp, c)}
                </span>
                {hasPrev && pExp !== undefined ? (
                  <PctCell
                    tone={expensePctTone(exp, pExp)}
                    text={formatPct(exp, pExp)}
                  />
                ) : (
                  <span className={styles.pctMuted}>—</span>
                )}
              </div>

              <div className={styles.metric}>
                <span className={styles.metricName}>Saldo</span>
                <span className={styles.metricVal}>
                  {formatMoney(sal, c)}
                </span>
                {hasPrev && pSal !== undefined ? (
                  <PctCell
                    tone={balancePctTone(sal, pSal)}
                    text={formatPct(sal, pSal)}
                  />
                ) : (
                  <span className={styles.pctMuted}>—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
