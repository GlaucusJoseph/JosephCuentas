import React, { useMemo } from "react";
import { useBudgetContext } from "../../../context/BudgetContext";
import { buildMonthSummary } from "../../../domain/calculations";
import { getMonthKey } from "../../../domain/models";
import { formatMonthTitleEs } from "../../../domain/dateLabels";
import { MonthlySummary } from "../../organisms/MonthlySummary/MonthlySummary";
import { MonthMovements } from "../../organisms/MonthMovements/MonthMovements";
import { BudgetVsActualCharts } from "../../organisms/BudgetVsActualCharts/BudgetVsActualCharts";
import { MonthVsPreviousKpis } from "../../organisms/MonthVsPreviousKpis/MonthVsPreviousKpis";
import styles from "./ExpensesDashboardPage.module.css";

const peso = (value: number): string =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);

export const ExpensesDashboardPage: React.FC = () => {
  const { state, selectMonth } = useBudgetContext();

  const monthsSorted = useMemo(
    () =>
      [...state.months].sort((a, b) => {
        if (a.year === b.year) return a.month - b.month;
        return a.year - b.year;
      }),
    [state.months],
  );

  const budgetMonthKey = useMemo(() => {
    if (monthsSorted.length === 0) return "";
    const sel = state.selectedMonthKey;
    const hasSel = monthsSorted.some(
      (m) => getMonthKey(m.year, m.month) === sel,
    );
    if (hasSel) return sel;
    const last = monthsSorted[monthsSorted.length - 1];
    return getMonthKey(last.year, last.month);
  }, [monthsSorted, state.selectedMonthKey]);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>Gastos personales</h1>
      </header>

      {budgetMonthKey ? (
        <>
          <section className={styles.budgetSection} aria-labelledby="budget-heading">
            <h2 id="budget-heading" className={styles.sectionHeading}>
              Presupuesto vs real
            </h2>
            <BudgetVsActualCharts monthKey={budgetMonthKey} />
          </section>

          <MonthVsPreviousKpis monthKey={budgetMonthKey} />
        </>
      ) : null}

      <div className={styles.accordionList}>
        {monthsSorted.map((month) => {
          const key = getMonthKey(month.year, month.month);
          const summary = buildMonthSummary(month);
          const totalExpensesCLP = summary.expensesByCurrency.CLP;
          const totalIncomesCLP = summary.incomesByCurrency.CLP;
          const netCLP = summary.netByCurrency.CLP;
          const monthLabel = formatMonthTitleEs(month.month, month.year);

          return (
            <details
              key={key}
              className={styles.accordionItem}
              open={key === state.selectedMonthKey}
              onToggle={(event) => {
                const el = event.currentTarget as HTMLDetailsElement;
                if (el.open) {
                  selectMonth(key);
                }
              }}
            >
              <summary className={styles.accordionHeader}>
                <span className={styles.accordionHeaderMain}>{monthLabel}</span>
                <span className={styles.accordionHeaderMeta}>
                  Ing CLP: {peso(totalIncomesCLP)} · Gas CLP:{" "}
                  {peso(totalExpensesCLP)} · Neto CLP: {peso(netCLP)}
                </span>
              </summary>

              <div className={styles.accordionBody}>
                <section className={styles.monthPanel}>
                  <h3 className={styles.monthPanelTitle}>Resumen del mes</h3>
                  <div className={styles.monthPanelBody}>
                    <MonthlySummary monthKey={key} />
                  </div>
                </section>

                <section className={styles.monthPanel}>
                  <h3 className={styles.monthPanelTitle}>Movimientos del mes</h3>
                  <div className={styles.monthPanelBody}>
                    <MonthMovements monthKey={key} />
                  </div>
                </section>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
};
