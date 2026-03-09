import React from 'react';
import styles from './Button.module.css';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button: React.FC<ButtonProps> = ({ className, ...rest }) => {
  const classes = className
    ? `${styles.button} ${className}`
    : styles.button;
  return <button className={classes} {...rest} />;
};

