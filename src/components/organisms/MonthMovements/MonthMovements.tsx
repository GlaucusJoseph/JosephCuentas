import React, { useMemo, useState } from 'react';
import {
  Expense,
  ExpenseType,
  Income,
  IncomeType,
  Currency,
  Conversion,
  getMonthKey,
  EXPENSE_TYPES,
  EXPENSE_TYPE_LABELS,
} from '../../../domain/models';
import { normalizeLegacyExpenseType } from '../../../domain/calculations';
import { useBudgetContext } from '../../../context/BudgetContext';
import { Button } from '../../atoms/Button/Button';
import { TextInput } from '../../atoms/TextInput/TextInput';
import { NumberInput } from '../../atoms/NumberInput/NumberInput';
import { Select } from '../../atoms/Select/Select';
import { CurrencyInput } from '../../molecules/CurrencyInput/CurrencyInput';
import styles from './MonthMovements.module.css';

type MovementKind = 'INCOME' | 'EXPENSE' | 'CONVERSION';

const formatAmount = (value: number): string =>
  new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

interface Props {
  monthKey: string;
}

interface MovementRow {
  kind: MovementKind;
  id: string;
  label: string;
  amountOriginal: number;
  currencyOriginal: Currency;
  note?: string;
  expenseType?: ExpenseType;
  incomeType?: IncomeType;
  fromCurrency?: Currency;
  fromAmount?: number;
}

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, title, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            title="Cerrar"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
};

export const MonthMovements: React.FC<Props> = ({ monthKey }) => {
  const {
    state,
    addIncome,
    addExpense,
    addConversion,
    removeIncome,
    removeExpense,
    removeConversion,
    updateExpense,
    updateIncome,
    updateConversion,
  } = useBudgetContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [kind, setKind] = useState<MovementKind>('EXPENSE');
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [incomeType, setIncomeType] = useState<IncomeType>('SUELDO');
  const [expenseType, setExpenseType] = useState<ExpenseType>('MERCADO');
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState<Currency>('CLP');
  const [note, setNote] = useState<string>('');
  const [fromCurrency, setFromCurrency] = useState<Currency>('CLP');
  const [fromAmount, setFromAmount] = useState<number | ''>('');
  const [toCLP, setToCLP] = useState<number | ''>('');
  const [toUSD, setToUSD] = useState<number | ''>('');
  const [toARS, setToARS] = useState<number | ''>('');

  const month = state.months.find(
    (m) => getMonthKey(m.year, m.month) === monthKey,
  );

  const rows: MovementRow[] = useMemo(() => {
    if (!month) return [];
    const incomeRows: MovementRow[] = month.incomes.map((i: Income) => ({
      kind: 'INCOME',
      id: i.id,
      label: `Ingreso · ${i.type}`,
      amountOriginal: i.amountOriginal,
      currencyOriginal: i.currencyOriginal,
      note: i.note,
      incomeType: i.type,
    }));

    const expenseRows: MovementRow[] = month.expenses.map((e: Expense) => ({
      kind: 'EXPENSE',
      id: e.id,
      label: `Gasto · ${
        EXPENSE_TYPE_LABELS[normalizeLegacyExpenseType(String(e.type))]
      }`,
      amountOriginal: e.amountOriginal,
      currencyOriginal: e.currencyOriginal,
      note: e.note,
      expenseType: e.type,
    }));
    const conversionRows: MovementRow[] = (month.conversions ?? []).map(
      (c: Conversion) => {
        const entries = Object.entries(c.toAmounts ?? {}) as [
          Currency,
          number | undefined,
        ][];
        const active = entries.filter(([, amount]) => amount && amount > 0);
        const destinations = active.map(([currency]) => currency).join(', ');
        return {
          kind: 'CONVERSION' as const,
          id: c.id,
          label: destinations
            ? `Cambio · ${c.fromCurrency} → ${destinations}`
            : `Cambio · ${c.fromCurrency}`,
          amountOriginal: c.fromAmount,
          currencyOriginal: c.fromCurrency,
          amountInCLP: 0,
          note: c.note,
          fromCurrency: c.fromCurrency,
          fromAmount: c.fromAmount,
        };
      },
    );

    return [...incomeRows, ...expenseRows, ...conversionRows];
  }, [month]);

  const resetForm = () => {
    setEditingId(null);
    setKind('EXPENSE');
    setDate(new Date().toISOString().slice(0, 10));
    setIncomeType('SUELDO');
    setExpenseType('MERCADO');
    setAmount('');
    setCurrency('CLP');
    setNote('');
  };

  const startEdit = (row: MovementRow) => {
    setEditingId(row.id);
    setKind(row.kind);
    setNote(row.note ?? '');
    if (row.kind === 'INCOME') {
      if (row.incomeType) setIncomeType(row.incomeType);
      setAmount(row.amountOriginal);
      setCurrency(row.currencyOriginal);
      const source = month?.incomes?.find((i) => i.id === row.id);
      setDate(source?.date ?? new Date().toISOString().slice(0, 10));
    } else if (row.kind === 'EXPENSE') {
      if (row.expenseType) {
        setExpenseType(normalizeLegacyExpenseType(String(row.expenseType)));
      }
      setAmount(row.amountOriginal);
      setCurrency(row.currencyOriginal);
      const source = month?.expenses.find((e) => e.id === row.id);
      setDate(source?.date ?? new Date().toISOString().slice(0, 10));
    } else if (row.kind === 'CONVERSION') {
      const conv = month?.conversions?.find((c) => c.id === row.id);
      if (conv) {
        setFromCurrency(conv.fromCurrency);
        setFromAmount(conv.fromAmount);
        setToCLP(conv.toAmounts.CLP ?? '');
        setToUSD(conv.toAmounts.USD ?? '');
        setToARS(conv.toAmounts.ARS ?? '');
        setDate(conv.date ?? new Date().toISOString().slice(0, 10));
      }
    }
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (kind === 'CONVERSION') {
      const numericFromAmount =
        typeof fromAmount === 'number' ? fromAmount : Number(fromAmount);
      const numericToCLP =
        toCLP === '' ? 0 : typeof toCLP === 'number' ? toCLP : Number(toCLP);
      const numericToUSD =
        toUSD === '' ? 0 : typeof toUSD === 'number' ? toUSD : Number(toUSD);
      const numericToARS =
        toARS === '' ? 0 : typeof toARS === 'number' ? toARS : Number(toARS);

      if (
        Number.isNaN(numericFromAmount) ||
        numericFromAmount <= 0 ||
        (numericToCLP <= 0 && numericToUSD <= 0 && numericToARS <= 0)
      ) {
        return;
      }

      const input = {
        date,
        fromCurrency,
        fromAmount: numericFromAmount,
        toCLP: numericToCLP > 0 ? numericToCLP : undefined,
        toUSD: numericToUSD > 0 ? numericToUSD : undefined,
        toARS: numericToARS > 0 ? numericToARS : undefined,
        note: note || undefined,
      };

      if (editingId) {
        updateConversion(monthKey, editingId, input);
      } else {
        addConversion(monthKey, input);
      }
    } else {
      if (amount === '' || amount <= 0) return;

      const input = {
        date,
        amountOriginal: typeof amount === 'number' ? amount : Number(amount),
        currencyOriginal: currency,
        note: note || undefined,
      };

      if (editingId) {
        if (kind === 'INCOME') {
          updateIncome(monthKey, editingId, { ...input, type: incomeType });
        } else {
          updateExpense(monthKey, editingId, { ...input, type: expenseType });
        }
      } else {
        if (kind === 'INCOME') {
          addIncome(monthKey, { ...input, type: incomeType });
        } else {
          addExpense(monthKey, { ...input, type: expenseType });
        }
      }
    }

    resetForm();
    setIsEditing(false);
  };

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Tipo</th>
            <th className={styles.th}>Monto</th>
            <th className={styles.th}>Moneda</th>
            <th className={styles.th}>Nota</th>
            <th className={styles.th}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={styles.row}>
              <td className={styles.td}>
                <span
                  className={`${styles.typeTag} ${
                    row.kind === 'INCOME'
                      ? styles.typeIncome
                      : row.kind === 'EXPENSE'
                        ? styles.typeExpense
                        : styles.typeConversion
                  }`}
                >
                  {row.label}
                </span>
              </td>
              <td className={styles.td}>{formatAmount(row.amountOriginal)}</td>
              <td className={styles.td}>{row.currencyOriginal}</td>
              <td className={styles.td}>{row.note}</td>
              <td className={styles.td}>
                <div className={styles.actions}>
                  <Button
                    type="button"
                    className={`${styles.compactButton} ${styles.editButton} ${styles.iconButton}`}
                    onClick={() => startEdit(row)}
                    title="Editar"
                    aria-label="Editar"
                  >
                    <span>✎</span>
                  </Button>
                  <Button
                    type="button"
                    className={`${styles.compactButton} ${styles.deleteButton} ${styles.iconButton}`}
                    onClick={() => {
                      if (row.kind === 'INCOME') {
                        removeIncome(monthKey, row.id);
                      } else if (row.kind === 'EXPENSE') {
                        removeExpense(monthKey, row.id);
                      } else {
                        removeConversion(monthKey, row.id);
                      }
                    }}
                    title="Eliminar"
                    aria-label="Eliminar"
                  >
                    <span>🗑</span>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="button"
          className={styles.compactButton}
          onClick={() => {
            if (isEditing) {
              resetForm();
              setIsEditing(false);
            } else {
              setEditingId(null);
              resetForm();
              setIsEditing(true);
            }
          }}
        >
          {isEditing ? 'Cancelar' : 'Agregar movimiento'}
        </Button>
      </div>

      <Modal
        isOpen={isEditing}
        title={editingId ? 'Editar movimiento' : 'Agregar movimiento'}
        onClose={() => {
          resetForm();
          setIsEditing(false);
        }}
      >
        <form className={styles.editForm} onSubmit={handleSave}>
          <div className={styles.editFormField}>
            <label className={styles.editFormLabel}>Tipo de movimiento</label>
            <Select
              value={kind}
              onChange={(e) => setKind(e.target.value as MovementKind)}
            >
              <option value="EXPENSE">Gasto</option>
              <option value="INCOME">Ingreso</option>
              <option value="CONVERSION">Cambio de divisa</option>
            </Select>
          </div>

          {kind === 'INCOME' && (
            <div className={styles.editFormField}>
              <label className={styles.editFormLabel}>Tipo de ingreso</label>
              <Select
                value={incomeType}
                onChange={(e) => setIncomeType(e.target.value as IncomeType)}
              >
                <option value="SUELDO">Sueldo</option>
                <option value="BONO">Bono</option>
                <option value="OTROS_INGRESOS">Otros ingresos</option>
              </Select>
            </div>
          )}

          {kind === 'EXPENSE' && (
            <div className={styles.editFormField}>
              <label className={styles.editFormLabel}>Tipo de gasto</label>
              <Select
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value as ExpenseType)}
              >
                {EXPENSE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {EXPENSE_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {kind !== 'CONVERSION' && (
            <div className={styles.editFormField}>
              <label className={styles.editFormLabel}>Monto y moneda</label>
              <CurrencyInput
                amount={amount}
                currency={currency}
                onAmountChange={setAmount}
                onCurrencyChange={setCurrency}
              />
            </div>
          )}

          {kind === 'CONVERSION' && (
            <div className={styles.editFormRow}>
              <div className={styles.editFormField}>
                <label className={styles.editFormLabel}>Entrego</label>
                <CurrencyInput
                  amount={fromAmount}
                  currency={fromCurrency}
                  onAmountChange={setFromAmount}
                  onCurrencyChange={setFromCurrency}
                />
              </div>
              <div className={styles.editFormField}>
                <label className={styles.editFormLabel}>Recibo</label>
                <div className={styles.receiveGrid}>
                  <NumberInput
                    value={toCLP}
                    onChange={(e) => {
                      const v = e.target.value;
                      setToCLP(v === '' ? '' : Number(v));
                    }}
                    min={0}
                    step="0.01"
                    placeholder="CLP"
                  />
                  <NumberInput
                    value={toUSD}
                    onChange={(e) => {
                      const v = e.target.value;
                      setToUSD(v === '' ? '' : Number(v));
                    }}
                    min={0}
                    step="0.01"
                    placeholder="USD"
                  />
                  <NumberInput
                    value={toARS}
                    onChange={(e) => {
                      const v = e.target.value;
                      setToARS(v === '' ? '' : Number(v));
                    }}
                    min={0}
                    step="0.01"
                    placeholder="ARS"
                  />
                </div>
              </div>
            </div>
          )}

          <div className={styles.editFormField}>
            <label className={styles.editFormLabel}>Comentario</label>
            <TextInput
              placeholder="Opcional"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className={styles.modalActions}>
            <Button
              type="button"
              className={`${styles.compactButton} ${styles.secondaryButton}`}
              onClick={() => {
                resetForm();
                setIsEditing(false);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" className={styles.compactButton}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

