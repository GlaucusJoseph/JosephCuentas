import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, subtitle, children }) => {
  return (
    <section className={styles.card}>
      {title && <h2 className={styles.cardTitle}>{title}</h2>}
      {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
      {children}
    </section>
  );
};

