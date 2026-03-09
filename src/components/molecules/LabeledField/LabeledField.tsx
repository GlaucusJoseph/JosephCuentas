import React from 'react';
import styles from './LabeledField.module.css';

interface Props {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export const LabeledField: React.FC<Props> = ({ label, hint, children }) => {
  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <span className={styles.label}>{label}</span>
        {hint ? <span className={styles.hint}>{hint}</span> : null}
      </div>
      {children}
    </div>
  );
};

