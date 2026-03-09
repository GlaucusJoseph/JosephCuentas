import React from 'react';
import { useMonthlyBudget } from '../../../hooks/useMonthlyBudget';
import { Currency } from '../../../domain/models';
import styles from './MonthlyComparison.module.css';

const formatMoney = (value: number, currency: Currency): string =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);

function TrendCell({
  value,
  currency,
}: {
  value: number | null;
  currency: Currency;
}) {
  if (value == null) {
    return (
      <span className={styles.trendCell}>
        <span className={styles.trendFlat}>−</span>
        <span>—</span>
      </span>
    );
  }
  if (value > 0) {
    return (
      <span className={styles.trendCell}>
        <span className={styles.trendUp} title="Mayor que el mes anterior">↑</span>
        <span>{formatMoney(value, currency)}</span>
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className={styles.trendCell}>
        <span className={styles.trendDown} title="Menor que el mes anterior">↓</span>
        <span>{formatMoney(value, currency)}</span>
      </span>
    );
  }
  return (
    <span className={styles.trendCell}>
      <span className={styles.trendFlat}>−</span>
      <span>{formatMoney(0, currency)}</span>
    </span>
  );
}

export const MonthlyComparison: React.FC = () => {
  const { comparisons } = useMonthlyBudget();

  if (comparisons.length === 0) {
    return <p>No hay meses registrados aún.</p>;
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th className={styles.th}>Mes</th>
          <th className={styles.th}>Neto CLP</th>
          <th className={styles.th}>Δ CLP</th>
          <th className={styles.th}>Neto USD</th>
          <th className={styles.th}>Δ USD</th>
          <th className={styles.th}>Neto ARS</th>
          <th className={styles.th}>Δ ARS</th>
        </tr>
      </thead>
      <tbody>
        {comparisons.map((c) => (
          <tr key={c.monthKey} className={styles.row}>
            <td className={styles.td}>{c.monthKey}</td>
            <td className={styles.td}>
              {formatMoney(c.netByCurrency.CLP, 'CLP')}
            </td>
            <td className={styles.td}>
              <TrendCell value={c.diffPrevNetByCurrency.CLP} currency="CLP" />
            </td>
            <td className={styles.td}>
              {formatMoney(c.netByCurrency.USD, 'USD')}
            </td>
            <td className={styles.td}>
              <TrendCell value={c.diffPrevNetByCurrency.USD} currency="USD" />
            </td>
            <td className={styles.td}>
              {formatMoney(c.netByCurrency.ARS, 'ARS')}
            </td>
            <td className={styles.td}>
              <TrendCell value={c.diffPrevNetByCurrency.ARS} currency="ARS" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

