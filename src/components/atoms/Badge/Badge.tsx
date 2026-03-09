import React from 'react';
import styles from './Badge.module.css';

type Tone = 'default' | 'success' | 'warning' | 'danger';

interface Props {
  tone?: Tone;
  children: React.ReactNode;
}

export const Badge: React.FC<Props> = ({ tone = 'default', children }) => {
  const toneClass =
    tone === 'success'
      ? styles.success
      : tone === 'warning'
      ? styles.warning
      : tone === 'danger'
      ? styles.danger
      : '';

  const classes = `${styles.badge}${toneClass ? ` ${toneClass}` : ''}`;

  return <span className={classes}>{children}</span>;
};

