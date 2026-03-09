import React, { useMemo } from 'react';
import { useBudgetContext } from '../../../context/BudgetContext';
import { buildMonthSummary } from '../../../domain/calculations';
import { Currency, getMonthKey } from '../../../domain/models';
import styles from './MonthlySummary.module.css';

const formatMoney = (value: number, currency: Currency): string =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);

function ExpenseTrendIcon({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  if (current > previous) {
    return (
      <span className={styles.trendCell} title="Gasto mayor al mes anterior">
        <span className={styles.trendUp}>↑</span>
      </span>
    );
  }
  if (current < previous) {
    return (
      <span className={styles.trendCell} title="Gasto menor al mes anterior">
        <span className={styles.trendDown}>↓</span>
      </span>
    );
  }
  return (
    <span className={styles.trendCell} title="Sin cambio">
      <span className={styles.trendFlat}>−</span>
    </span>
  );
}

interface Props {
  /** Si se pasa, se usa este mes del estado (para que Resumen refleje siempre el mes del acordeón abierto). */
  monthKey?: string;
}

export const MonthlySummary: React.FC<Props> = ({ monthKey }) => {
  const { state } = useBudgetContext();
  const resolvedKey = monthKey ?? state.selectedMonthKey;

  const month = useMemo(
    () =>
      resolvedKey
        ? state.months.find(
            (m) => getMonthKey(m.year, m.month) === resolvedKey,
          )
        : null,
    [state.months, resolvedKey],
  );

  const sortedMonths = useMemo(
    () =>
      [...state.months].sort((a, b) => {
        if (a.year === b.year) return a.month - b.month;
        return a.year - b.year;
      }),
    [state.months],
  );

  const prevMonth = useMemo(() => {
    if (!resolvedKey) return null;
    const idx = sortedMonths.findIndex(
      (m) => getMonthKey(m.year, m.month) === resolvedKey,
    );
    if (idx <= 0) return null;
    return sortedMonths[idx - 1] ?? null;
  }, [sortedMonths, resolvedKey]);

  const monthSummary = useMemo(
    () => (month ? buildMonthSummary(month) : null),
    [month],
  );

  const prevMonthSummary = useMemo(
    () => (prevMonth ? buildMonthSummary(prevMonth) : null),
    [prevMonth],
  );

  if (!month || !monthSummary) {
    return <p>No hay datos para este mes.</p>;
  }

  const {
    incomesByCurrency,
    expensesByCurrency,
    netByCurrency,
    endingBalances,
    totalsByTypeByCurrency,
  } = monthSummary;

  const currencies: Currency[] = ['CLP', 'USD', 'ARS'];

  return (
    <div>
      <h4 className={styles.sectionTitle}>Totales por moneda</h4>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Moneda</th>
              <th className={styles.th}>Ingresos</th>
              <th className={styles.th}>Gastos</th>
              <th className={styles.th}>Neto</th>
              <th className={styles.th}>Saldo final</th>
            </tr>
          </thead>
          <tbody>
            {currencies.map((c) => (
              <tr key={c}>
                <td className={styles.td}>{c}</td>
                <td className={styles.td}>
                  {formatMoney(incomesByCurrency[c], c)}
                </td>
                <td className={styles.td}>
                  {formatMoney(expensesByCurrency[c], c)}
                </td>
                <td className={styles.td}>
                  {formatMoney(netByCurrency[c], c)}
                </td>
                <td className={styles.td}>
                  {formatMoney(endingBalances[c], c)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {prevMonthSummary && (
        <>
          <h4 className={styles.sectionTitle}>Gastos vs mes anterior</h4>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Moneda</th>
                  <th className={styles.th}>Este mes</th>
                  <th className={styles.th}>Mes anterior</th>
                  <th className={styles.th}>Tendencia</th>
                </tr>
              </thead>
              <tbody>
                {currencies.map((c) => (
                  <tr key={c}>
                    <td className={styles.td}>{c}</td>
                    <td className={styles.td}>
                      {formatMoney(expensesByCurrency[c], c)}
                    </td>
                    <td className={styles.td}>
                      {formatMoney(prevMonthSummary.expensesByCurrency[c], c)}
                    </td>
                    <td className={styles.td}>
                      <ExpenseTrendIcon
                        current={expensesByCurrency[c]}
                        previous={prevMonthSummary.expensesByCurrency[c]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h4 className={styles.sectionTitle}>Totales por tipo de gasto</h4>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Tipo</th>
              <th className={styles.th}>CLP</th>
              <th className={styles.th}>USD</th>
              <th className={styles.th}>ARS</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(totalsByTypeByCurrency).map(([type, money]) => (
              <tr key={type}>
                <td className={styles.td}>{type}</td>
                <td className={styles.td}>
                  {formatMoney(money.CLP, 'CLP')}
                </td>
                <td className={styles.td}>
                  {formatMoney(money.USD, 'USD')}
                </td>
                <td className={styles.td}>
                  {formatMoney(money.ARS, 'ARS')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

