import React from 'react';
import { useMonthlyBudget } from '../../../hooks/useMonthlyBudget';
import styles from './ExpensesTable.module.css';

const peso = (value: number): string =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);

export const ExpensesTable: React.FC = () => {
  const { currentMonth } = useMonthlyBudget();

  if (!currentMonth || currentMonth.expenses.length === 0) {
    return <p>No hay gastos aún para este mes.</p>;
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th className={styles.th}>Fecha</th>
          <th className={styles.th}>Tipo</th>
          <th className={styles.th}>Monto</th>
          <th className={styles.th}>CLP</th>
          <th className={styles.th}>Nota</th>
        </tr>
      </thead>
      <tbody>
        {currentMonth.expenses.map((e) => (
          <tr key={e.id} className={styles.row}>
            <td className={styles.td}>{e.date}</td>
            <td className={styles.td}>{e.type}</td>
            <td className={`${styles.td} ${styles.right}`}>
              {e.amountOriginal} {e.currencyOriginal}
            </td>
            <td className={`${styles.td} ${styles.right}`}>
              {peso(e.amountInCLP)}
            </td>
            <td className={styles.td}>{e.note}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

