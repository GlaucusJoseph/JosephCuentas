import React from 'react';
import { Currency } from '../../../domain/models';
import { NumberInput } from '../../atoms/NumberInput/NumberInput';
import { Select } from '../../atoms/Select/Select';
import styles from './CurrencyInput.module.css';

interface Props {
  amount: number | '';
  currency: Currency;
  onAmountChange: (value: number | '') => void;
  onCurrencyChange: (value: Currency) => void;
}

export const CurrencyInput: React.FC<Props> = ({
  amount,
  currency,
  onAmountChange,
  onCurrencyChange,
}) => {
  return (
    <div className={styles.row}>
      <NumberInput
        value={amount}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '') {
            onAmountChange('');
          } else {
            onAmountChange(Number(v));
          }
        }}
        min={0}
        step="0.01"
      />
      <Select
        value={currency}
        onChange={(e) => onCurrencyChange(e.target.value as Currency)}
      >
        <option value="CLP">CLP</option>
        <option value="USD">USD</option>
        <option value="ARS">ARS</option>
      </Select>
    </div>
  );
};

