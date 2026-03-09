import React, { useState } from 'react';
import { useBudgetContext } from '../../../context/BudgetContext';
import { NumberInput } from '../../atoms/NumberInput/NumberInput';
import { Button } from '../../atoms/Button/Button';
import { LabeledField } from '../../molecules/LabeledField/LabeledField';
import styles from './BalanceInputs.module.css';

interface Props {
  monthKey: string;
}

export const BalanceInputs: React.FC<Props> = ({ monthKey }) => {
  const { currentMonth, updateBalances } = useBudgetContext();

  const [initialBudgetCLP, setInitialBudgetCLP] = useState<
    number | ''
  >(currentMonth?.initialBudgetCLP ?? '');
  const [clp, setClp] = useState<number | ''>(
    currentMonth?.currentBalances.CLP ?? '',
  );
  const [usd, setUsd] = useState<number | ''>(
    currentMonth?.currentBalances.USD ?? '',
  );
  const [ars, setArs] = useState<number | ''>(
    currentMonth?.currentBalances.ARS ?? '',
  );

  const handleSave = () => {
    updateBalances({
      monthKey,
      initialBudgetCLP:
        initialBudgetCLP === '' ? undefined : Number(initialBudgetCLP),
      clp: clp === '' ? undefined : Number(clp),
      usd: usd === '' ? undefined : Number(usd),
      ars: ars === '' ? undefined : Number(ars),
    });
  };

  return (
    <div>
      <div className={styles.grid}>
        <LabeledField label="Presupuesto inicial (CLP)">
          <NumberInput
            value={initialBudgetCLP}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '') setInitialBudgetCLP('');
              else setInitialBudgetCLP(Number(v));
            }}
            min={0}
          />
        </LabeledField>

        <LabeledField label="Saldo actual CLP">
          <NumberInput
            value={clp}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '') setClp('');
              else setClp(Number(v));
            }}
            min={0}
          />
        </LabeledField>

        <LabeledField label="Saldo actual USD">
          <NumberInput
            value={usd}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '') setUsd('');
              else setUsd(Number(v));
            }}
            min={0}
          />
        </LabeledField>

        <LabeledField label="Saldo actual ARS">
          <NumberInput
            value={ars}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '') setArs('');
              else setArs(Number(v));
            }}
            min={0}
          />
        </LabeledField>
      </div>

      <div className={styles.actions}>
        <Button type="button" onClick={handleSave}>
          Guardar saldos
        </Button>
      </div>
    </div>
  );
};

