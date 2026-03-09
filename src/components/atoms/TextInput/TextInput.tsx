import React from 'react';
import styles from './TextInput.module.css';

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export const TextInput: React.FC<Props> = ({ className, ...rest }) => {
  const classes = className
    ? `${styles.input} ${className}`
    : styles.input;
  return <input className={classes} {...rest} />;
};

