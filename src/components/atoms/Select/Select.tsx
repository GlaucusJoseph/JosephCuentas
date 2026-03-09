import React from 'react';
import styles from './Select.module.css';

type Props = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select: React.FC<Props> = ({ className, children, ...rest }) => {
  const classes = className
    ? `${styles.select} ${className}`
    : styles.select;
  return (
    <select className={classes} {...rest}>
      {children}
    </select>
  );
};

