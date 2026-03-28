import React, { useMemo, useState } from 'react';
import { useBudgetContext } from '../../../context/BudgetContext';
import {
  ExpenseType,
  EXPENSE_TYPES,
  EXPENSE_TYPE_LABELS,
  emptyExpenseTargetsCLP,
  getMonthKey,
} from '../../../domain/models';
import {
  getActualExpenseTotalsByTypeCLP,
  sumExpenseTargetsCLP,
} from '../../../domain/calculations';
import { donutSegmentPath } from './donutGeometry';
import { fillGreenSequence, GAP_COLOR, OVER_BUDGET_COLOR } from './chartColors';
import { Button } from '../../atoms/Button/Button';
import { NumberInput } from '../../atoms/NumberInput/NumberInput';
import styles from './BudgetVsActualCharts.module.css';

const peso = (value: number): string =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);

type HoverInfo = {
  label: string;
  amount: number;
  sub?: string;
};

function buildObjectiveScaledSegments(
  values: Record<ExpenseType, number>,
  scaleMax: number,
): {
  segments: {
    key: string;
    type: ExpenseType;
    startDeg: number;
    endDeg: number;
    amount: number;
    fill: string;
  }[];
  gap: { startDeg: number; endDeg: number } | null;
} {
  const parts = EXPENSE_TYPES.map((type) => ({
    type,
    amount: Math.max(0, values[type]),
  })).filter((p) => p.amount > 0);
  const totalAmount = parts.reduce((s, p) => s + p.amount, 0);
  const ref = scaleMax > 0 ? scaleMax : 0;
  if (ref <= 0) {
    return { segments: [], gap: { startDeg: 0, endDeg: 360 } };
  }
  if (totalAmount <= 0) {
    return {
      segments: [],
      gap: { startDeg: 0, endDeg: 360 },
    };
  }

  let startDeg = 0;
  const segments: {
    key: string;
    type: ExpenseType;
    startDeg: number;
    endDeg: number;
    amount: number;
    fill: string;
  }[] = [];

  parts.forEach((p, idx) => {
    let span = (p.amount / ref) * 360;
    if (startDeg + span > 360) {
      span = Math.max(0, 360 - startDeg);
    }
    if (span <= 0.0001) {
      return;
    }
    const endDeg = startDeg + span;
    segments.push({
      key: `obj-${p.type}-${idx}`,
      type: p.type,
      startDeg,
      endDeg,
      amount: p.amount,
      fill: fillGreenSequence(idx, parts.length),
    });
    startDeg = endDeg;
  });

  const gap =
    startDeg < 359.9 ? { startDeg, endDeg: 360 as number } : null;
  return { segments, gap };
}

type ActualSeg = {
  key: string;
  type: ExpenseType;
  startDeg: number;
  endDeg: number;
  fill: string;
  label: string;
  amount: number;
  sub?: string;
};

function buildActualScaledSegments(
  actual: Record<ExpenseType, number>,
  targets: Record<ExpenseType, number>,
  scaleMax: number,
  greenCountEstimate: number,
): { segments: ActualSeg[]; gap: { startDeg: number; endDeg: number } | null } {
  const parts = EXPENSE_TYPES.map((type) => ({
    type,
    amount: Math.max(0, actual[type]),
  })).filter((p) => p.amount > 0);
  const totalActual = parts.reduce((s, p) => s + p.amount, 0);
  const ref = scaleMax > 0 ? scaleMax : 0;
  if (ref <= 0) {
    return { segments: [], gap: { startDeg: 0, endDeg: 360 } };
  }
  if (totalActual <= 0) {
    return { segments: [], gap: { startDeg: 0, endDeg: 360 } };
  }

  let startDeg = 0;
  const segments: ActualSeg[] = [];
  let greenIdx = 0;

  parts.forEach((p, partIdx) => {
    const A = p.amount;
    const T = Math.max(0, targets[p.type] ?? 0);
    let maxSpan = (A / ref) * 360;
    if (startDeg + maxSpan > 360) {
      maxSpan = Math.max(0, 360 - startDeg);
    }
    if (maxSpan <= 0.0001) {
      return;
    }
    const endFull = startDeg + maxSpan;
    const label = EXPENSE_TYPE_LABELS[p.type];

    if (T === 0 && A > 0) {
      segments.push({
        key: `${p.type}-all-${partIdx}`,
        type: p.type,
        startDeg,
        endDeg: endFull,
        fill: OVER_BUDGET_COLOR,
        label,
        amount: A,
        sub: 'Sin objetivo definido',
      });
      startDeg = endFull;
      return;
    }

    if (A <= T) {
      const fill = fillGreenSequence(greenIdx, greenCountEstimate);
      greenIdx += 1;
      segments.push({
        key: `${p.type}-ok-${partIdx}`,
        type: p.type,
        startDeg,
        endDeg: endFull,
        fill,
        label,
        amount: A,
      });
      startDeg = endFull;
      return;
    }

    const withinSpan = maxSpan * (T / A);
    const mid = startDeg + withinSpan;
    const fillW = fillGreenSequence(greenIdx, greenCountEstimate);
    greenIdx += 1;
    segments.push({
      key: `${p.type}-in-${partIdx}`,
      type: p.type,
      startDeg,
      endDeg: mid,
      fill: fillW,
      label,
      amount: T,
      sub: 'Hasta objetivo',
    });
    segments.push({
      key: `${p.type}-ex-${partIdx}`,
      type: p.type,
      startDeg: mid,
      endDeg: endFull,
      fill: OVER_BUDGET_COLOR,
      label,
      amount: A - T,
      sub: 'Exceso sobre objetivo',
    });
    startDeg = endFull;
  });

  const gap =
    startDeg < 359.9 ? { startDeg, endDeg: 360 as number } : null;
  return { segments, gap };
}

function DonutCenterStats({
  presupuesto,
  gastoEstimado,
  ahorroEsperado,
}: {
  presupuesto: number;
  gastoEstimado: number;
  ahorroEsperado: number;
}) {
  return (
    <div className={styles.donutCenter}>
      <div className={styles.donutCenterLine}>
        <span className={styles.donutCenterLabel}>
          Presupuesto (valor inicial)
        </span>
        <span className={styles.donutCenterVal}>{peso(presupuesto)}</span>
      </div>
      <div className={styles.donutCenterLine}>
        <span className={styles.donutCenterLabel}>Gasto estimado</span>
        <span className={styles.donutCenterVal}>{peso(gastoEstimado)}</span>
      </div>
      <div className={styles.donutCenterLine}>
        <span className={styles.donutCenterLabel}>Ahorro esperado</span>
        <span className={styles.donutCenterVal}>{peso(ahorroEsperado)}</span>
      </div>
    </div>
  );
}

function ObjectiveDonutChart({
  values,
  title,
  scaleMax,
  centerProps,
}: {
  values: Record<ExpenseType, number>;
  title: string;
  scaleMax: number;
  centerProps: {
    presupuesto: number;
    gastoEstimado: number;
    ahorroEsperado: number;
  };
}) {
  const cx = 110;
  const cy = 110;
  const rOuter = 88;
  const rInner = 52;

  const [hover, setHover] = useState<HoverInfo | null>(null);

  const { segments, gap } = useMemo(
    () => buildObjectiveScaledSegments(values, scaleMax),
    [values, scaleMax],
  );

  return (
    <div className={styles.chartBlock}>
      <div className={styles.chartTitle}>{title}</div>
      <div className={styles.hoverBannerSlot}>
        {hover ? (
          <div className={styles.hoverBanner} aria-live="polite">
            <span className={styles.hoverBannerLabel}>{hover.label}</span>
            <span className={styles.hoverBannerAmount}>{peso(hover.amount)}</span>
            {hover.sub ? (
              <span className={styles.hoverBannerSub}>{hover.sub}</span>
            ) : null}
          </div>
        ) : (
          <div className={styles.hoverBannerPlaceholder} aria-hidden />
        )}
      </div>
      <div
        className={styles.svgWrap}
        onMouseLeave={() => setHover(null)}
      >
        <svg viewBox="0 0 220 220" width="220" height="220" aria-hidden>
          {gap && (
            <path
              d={donutSegmentPath(cx, cy, rOuter, rInner, gap.startDeg, gap.endDeg)}
              fill={GAP_COLOR}
              stroke="#020617"
              strokeWidth="1"
              className={styles.sectorGap}
            />
          )}
          {segments.map((s) => (
            <path
              key={s.key}
              d={donutSegmentPath(cx, cy, rOuter, rInner, s.startDeg, s.endDeg)}
              fill={s.fill}
              stroke="#020617"
              strokeWidth="1"
              className={styles.sector}
              onMouseEnter={() =>
                setHover({
                  label: EXPENSE_TYPE_LABELS[s.type],
                  amount: s.amount,
                })
              }
            />
          ))}
        </svg>
        <div className={styles.centerOverlay}>
          <DonutCenterStats {...centerProps} />
        </div>
      </div>
    </div>
  );
}

function ActualDonutChart({
  actual,
  targets,
  title,
  scaleMax,
  centerProps,
}: {
  actual: Record<ExpenseType, number>;
  targets: Record<ExpenseType, number>;
  title: string;
  scaleMax: number;
  centerProps: {
    presupuesto: number;
    gastoEstimado: number;
    ahorroEsperado: number;
  };
}) {
  const cx = 110;
  const cy = 110;
  const rOuter = 88;
  const rInner = 52;

  const [hover, setHover] = useState<HoverInfo | null>(null);

  const { segments, gap } = useMemo(
    () =>
      buildActualScaledSegments(
        actual,
        targets,
        scaleMax,
        EXPENSE_TYPES.length,
      ),
    [actual, targets, scaleMax],
  );

  return (
    <div className={styles.chartBlock}>
      <div className={styles.chartTitle}>{title}</div>
      <div className={styles.hoverBannerSlot}>
        {hover ? (
          <div className={styles.hoverBanner} aria-live="polite">
            <span className={styles.hoverBannerLabel}>{hover.label}</span>
            <span className={styles.hoverBannerAmount}>{peso(hover.amount)}</span>
            {hover.sub ? (
              <span className={styles.hoverBannerSub}>{hover.sub}</span>
            ) : null}
          </div>
        ) : (
          <div className={styles.hoverBannerPlaceholder} aria-hidden />
        )}
      </div>
      <div
        className={styles.svgWrap}
        onMouseLeave={() => setHover(null)}
      >
        <svg viewBox="0 0 220 220" width="220" height="220" aria-hidden>
          {gap && (
            <path
              d={donutSegmentPath(cx, cy, rOuter, rInner, gap.startDeg, gap.endDeg)}
              fill={GAP_COLOR}
              stroke="#020617"
              strokeWidth="1"
              className={styles.sectorGap}
            />
          )}
          {segments.map((s) => (
            <path
              key={s.key}
              d={donutSegmentPath(cx, cy, rOuter, rInner, s.startDeg, s.endDeg)}
              fill={s.fill}
              stroke="#020617"
              strokeWidth="1"
              className={styles.sector}
              onMouseEnter={() =>
                setHover({
                  label: s.label,
                  amount: s.amount,
                  sub: s.sub,
                })
              }
            />
          ))}
        </svg>
        <div className={styles.centerOverlay}>
          <DonutCenterStats {...centerProps} />
        </div>
      </div>
    </div>
  );
}

type DraftTargets = Record<ExpenseType, number | ''>;

function emptyDraft(): DraftTargets {
  const d = {} as DraftTargets;
  for (const t of EXPENSE_TYPES) {
    d[t] = '';
  }
  return d;
}

interface Props {
  monthKey: string;
}

export const BudgetVsActualCharts: React.FC<Props> = ({ monthKey }) => {
  const { state, updateBudgetPlanning } = useBudgetContext();
  const month = state.months.find(
    (m) => getMonthKey(m.year, m.month) === monthKey,
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<DraftTargets>(() => emptyDraft());
  const [draftValorInicial, setDraftValorInicial] = useState<number | ''>('');

  const targets = month?.expenseTargetsCLP ?? emptyExpenseTargetsCLP();
  const actual = useMemo(
    () =>
      month
        ? getActualExpenseTotalsByTypeCLP(month.expenses)
        : emptyExpenseTargetsCLP(),
    [month],
  );

  const valorInicial = month?.initialBudgetCLP ?? 0;
  const gastoEstimado = useMemo(() => sumExpenseTargetsCLP(targets), [targets]);
  const ahorroEsperado = valorInicial - gastoEstimado;

  const centerProps = {
    presupuesto: valorInicial,
    gastoEstimado,
    ahorroEsperado,
  };

  const openModal = () => {
    if (!month) return;
    const next: DraftTargets = emptyDraft();
    for (const t of EXPENSE_TYPES) {
      next[t] = month.expenseTargetsCLP[t];
    }
    setDraft(next);
    setDraftValorInicial(month.initialBudgetCLP ?? 0);
    setModalOpen(true);
  };

  const saveTargets = (e: React.FormEvent) => {
    e.preventDefault();
    if (!month) return;
    const next = emptyExpenseTargetsCLP();
    for (const t of EXPENSE_TYPES) {
      const v = draft[t];
      next[t] =
        v === '' || Number.isNaN(Number(v)) ? 0 : Math.max(0, Number(v));
    }
    const vi =
      draftValorInicial === '' || Number.isNaN(Number(draftValorInicial))
        ? 0
        : Math.max(0, Number(draftValorInicial));
    updateBudgetPlanning(monthKey, next, vi);
    setModalOpen(false);
  };

  if (!month) {
    return null;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <Button type="button" onClick={openModal}>
          Actualizar
        </Button>
      </div>

      <div className={styles.chartsRow}>
        <ObjectiveDonutChart
          values={targets}
          title="Objetivo"
          scaleMax={valorInicial}
          centerProps={centerProps}
        />
        <ActualDonutChart
          actual={actual}
          targets={targets}
          title="Actual"
          scaleMax={valorInicial}
          centerProps={centerProps}
        />
      </div>

      {modalOpen && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => setModalOpen(false)}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-labelledby="targets-modal-title"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3 id="targets-modal-title" className={styles.modalTitle}>
                Presupuesto y objetivos (CLP)
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setModalOpen(false)}
                title="Cerrar"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <form className={styles.modalBody} onSubmit={saveTargets}>
              <div className={styles.valorInicialRow}>
                <label
                  htmlFor="valor-inicial"
                  className={styles.valorInicialLabel}
                >
                  Valor inicial (presupuesto base)
                </label>
                <NumberInput
                  id="valor-inicial"
                  min={0}
                  step={1}
                  value={draftValorInicial}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraftValorInicial(v === '' ? '' : Number(v));
                  }}
                />
              </div>
              <p className={styles.modalHint}>Objetivo por categoría</p>
              <div className={styles.targetsGrid}>
                {EXPENSE_TYPES.map((t) => (
                  <div key={t} className={styles.targetRow}>
                    <label htmlFor={`target-${t}`}>
                      {EXPENSE_TYPE_LABELS[t]}
                    </label>
                    <NumberInput
                      id={`target-${t}`}
                      min={0}
                      step={1}
                      value={draft[t]}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDraft((prev) => ({
                          ...prev,
                          [t]: v === '' ? '' : Number(v),
                        }));
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className={styles.modalActions}>
                <Button type="button" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
