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

const CURRENCIES: Currency[] = ['CLP', 'USD', 'ARS'];

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
          {CURRENCIES.flatMap((currency) => [
            <th key={`${currency}-ingresos`} className={styles.th}>
              Ingresos {currency}
            </th>,
            <th key={`${currency}-gastos`} className={styles.th}>
              Gastos {currency}
            </th>,
            <th key={`${currency}-final`} className={styles.th}>
              Saldo {currency}
            </th>,
          ])}
        </tr>
      </thead>
      <tbody>
        {comparisons.map((c) => (
          <tr key={c.monthKey} className={styles.row}>
            <td className={styles.td}>{c.monthKey}</td>
            {CURRENCIES.flatMap((currency) => [
              <td key={`${c.monthKey}-${currency}-ingresos`} className={styles.td}>
                {formatMoney(c.incomesByCurrency[currency], currency)}
              </td>,
              <td key={`${c.monthKey}-${currency}-gastos`} className={styles.td}>
                {formatMoney(c.expensesByCurrency[currency], currency)}
              </td>,
              <td key={`${c.monthKey}-${currency}-final`} className={styles.td}>
                {formatMoney(c.endingBalancesByCurrency[currency], currency)}
              </td>,
            ])}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
