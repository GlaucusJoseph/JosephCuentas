import React from 'react';
import { useMonthlyBudget } from '../../../hooks/useMonthlyBudget';
import styles from './QuickLineComparison.module.css';

const peso = (value: number): string =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);

export const QuickLineComparison: React.FC = () => {
  const { firstMarketPerMonth } = useMonthlyBudget();

  if (firstMarketPerMonth.length === 0) {
    return <p>No hay datos de mercado aún.</p>;
  }

  return (
    <div className={styles.row}>
      {firstMarketPerMonth.map(({ monthKey, expense }) => (
        <div key={monthKey} className={styles.item}>
          <div className={styles.label}>{monthKey}</div>
          <div className={styles.value}>
            {expense ? peso(expense.amountInCLP) : 'Sin mercado'}
          </div>
        </div>
      ))}
    </div>
  );
};

