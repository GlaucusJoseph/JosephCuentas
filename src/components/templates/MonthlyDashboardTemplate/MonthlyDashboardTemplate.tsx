import React from 'react';
import styles from './MonthlyDashboardTemplate.module.css';

interface Props {
  leftColumn: React.ReactNode;
  rightColumn: React.ReactNode;
}

export const MonthlyDashboardTemplate: React.FC<Props> = ({
  leftColumn,
  rightColumn,
}) => {
  return (
    <div className={styles.layout}>
      <div className={styles.leftColumn}>{leftColumn}</div>
      <div className={styles.rightColumn}>{rightColumn}</div>
    </div>
  );
};

