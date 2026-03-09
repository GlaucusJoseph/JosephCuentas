import React from 'react';
import { useMonthlyBudget } from '../../../hooks/useMonthlyBudget';
import styles from './IncomesTable.module.css';

const peso = (value: number): string =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);

export const IncomesTable: React.FC = () => {
  const { currentMonth } = useMonthlyBudget();

  if (!currentMonth || !currentMonth.incomes || currentMonth.incomes.length === 0) {
    return <p>No hay ingresos aún para este mes.</p>;
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
        {currentMonth.incomes.map((i) => (
          <tr key={i.id} className={styles.row}>
            <td className={styles.td}>{i.date}</td>
            <td className={styles.td}>{i.type}</td>
            <td className={`${styles.td} ${styles.right}`}>
              {i.amountOriginal} {i.currencyOriginal}
            </td>
            <td className={`${styles.td} ${styles.right}`}>
              {peso(i.amountInCLP)}
            </td>
            <td className={styles.td}>{i.note}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

