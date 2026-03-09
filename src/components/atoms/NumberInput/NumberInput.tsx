import React from 'react';
import styles from './NumberInput.module.css';

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export const NumberInput: React.FC<Props> = ({ className, ...rest }) => {
  const classes = className
    ? `${styles.input} ${className}`
    : styles.input;
  return <input type="number" className={classes} {...rest} />;
};

