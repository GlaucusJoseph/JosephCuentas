import React, { useState } from 'react';
import { Currency, IncomeType } from '../../../domain/models';
import { useBudgetContext } from '../../../context/BudgetContext';
import { Button } from '../../atoms/Button/Button';
import { TextInput } from '../../atoms/TextInput/TextInput';
import { NumberInput } from '../../atoms/NumberInput/NumberInput';
import { Select } from '../../atoms/Select/Select';
import { LabeledField } from '../../molecules/LabeledField/LabeledField';
import { CurrencyInput } from '../../molecules/CurrencyInput/CurrencyInput';
import styles from './IncomeForm.module.css';

interface Props {
  monthKey: string;
}

export const IncomeForm: React.FC<Props> = ({ monthKey }) => {
  const { addIncome } = useBudgetContext();

  const todayStr = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState<string>(todayStr);
  const [type, setType] = useState<IncomeType>('SUELDO');
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState<Currency>('CLP');
  const [conversionRate, setConversionRate] = useState<number | ''>('');
  const [otherAmount, setOtherAmount] = useState<number | ''>('');
  const [otherCurrency, setOtherCurrency] = useState<Currency>('CLP');
  const [note, setNote] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '' || amount <= 0) return;

    addIncome(monthKey, {
      date,
      type,
      amountOriginal: amount,
      currencyOriginal: currency,
      conversionRateToCLP:
        conversionRate === '' ? undefined : Number(conversionRate),
      amountOtherCurrency:
        otherAmount === '' ? undefined : Number(otherAmount),
      currencyOther: otherCurrency,
      note: note || undefined,
    });

    setAmount('');
    setConversionRate('');
    setOtherAmount('');
    setNote('');
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div>
        <LabeledField label="Fecha">
          <TextInput
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </LabeledField>
      </div>

      <div>
        <LabeledField label="Tipo de ingreso">
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as IncomeType)}
          >
            <option value="SUELDO">Sueldo</option>
            <option value="BONO">Bono</option>
            <option value="OTROS_INGRESOS">Otros ingresos</option>
          </Select>
        </LabeledField>
      </div>

      <div className={styles.fullRow}>
        <LabeledField
          label="Monto"
          hint="Monto original + moneda"
        >
          <CurrencyInput
            amount={amount}
            currency={currency}
            onAmountChange={setAmount}
            onCurrencyChange={setCurrency}
          />
        </LabeledField>
      </div>

      <div>
        <LabeledField
          label="Conversión a CLP"
          hint="Opcional, tasa del día"
        >
          <NumberInput
            value={conversionRate}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '') setConversionRate('');
              else setConversionRate(Number(v));
            }}
            min={0}
            step="0.01"
          />
        </LabeledField>
      </div>

      <div>
        <LabeledField
          label="Monto directo en otra moneda"
          hint="Opcional, si ya sabes el valor equivalente"
        >
          <div className={styles.inlineRow}>
            <NumberInput
              value={otherAmount}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '') setOtherAmount('');
                else setOtherAmount(Number(v));
              }}
              min={0}
              step="0.01"
            />
            <Select
              value={otherCurrency}
              onChange={(e) =>
                setOtherCurrency(e.target.value as Currency)
              }
            >
              <option value="CLP">CLP</option>
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
            </Select>
          </div>
        </LabeledField>
      </div>

      <div className={styles.fullRow}>
        <LabeledField label="Comentario">
          <TextInput
            placeholder="Opcional"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </LabeledField>
      </div>

      <div className={`${styles.fullRow} ${styles.actions}`}>
        <Button type="submit">Agregar ingreso</Button>
      </div>
    </form>
  );
};

