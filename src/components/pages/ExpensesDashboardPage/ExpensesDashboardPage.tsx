import React, { useMemo, useRef } from "react";
import { useBudgetContext } from "../../../context/BudgetContext";
import { useMonthlyBudget } from "../../../hooks/useMonthlyBudget";
import { buildMonthSummary } from "../../../domain/calculations";
import { getMonthKey } from "../../../domain/models";
import { Card } from "../../atoms/Card/Card";
import { Button } from "../../atoms/Button/Button";
import { MonthlySummary } from "../../organisms/MonthlySummary/MonthlySummary";
import { MonthlyComparison } from "../../organisms/MonthlyComparison/MonthlyComparison";
import { MonthMovements } from "../../organisms/MonthMovements/MonthMovements";
import styles from "./ExpensesDashboardPage.module.css";

const peso = (value: number): string =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);

export const ExpensesDashboardPage: React.FC = () => {
  const { state, selectMonth, exportStateJson, importStateJson } =
    useBudgetContext();
  const { comparisons } = useMonthlyBudget();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const monthsSorted = useMemo(
    () =>
      [...state.months].sort((a, b) => {
        if (a.year === b.year) return a.month - b.month;
        return a.year - b.year;
      }),
    [state.months],
  );

  const handleExport = () => {
    const data = exportStateJson();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gastos-personales.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    importStateJson(text);
    event.target.value = "";
  };

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.title}>Gastos personales</h1>
        <p className={styles.subtitle}>
          Lista de meses desplegables, con ingresos, gastos y resúmenes en CLP.
        </p>
        <div className={styles.toolbar}>
          <Button type="button" onClick={handleExport}>
            Exportar JSON
          </Button>
          <Button type="button" onClick={handleImportClick}>
            Importar JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={handleImportChange}
          />
        </div>
      </header>

      <div className={styles.accordionList}>
        {monthsSorted.map((month) => {
          const key = getMonthKey(month.year, month.month);
          const summary = buildMonthSummary(month);
          const totalExpensesCLP = summary.expensesByCurrency.CLP;
          const totalIncomesCLP = summary.incomesByCurrency.CLP;
          const netCLP = summary.netByCurrency.CLP;

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
                <span className={styles.accordionHeaderMain}>
                  {month.month.toString().padStart(2, "0")}/{month.year}
                </span>
                <span className={styles.accordionHeaderMeta}>
                  Ing CLP: {peso(totalIncomesCLP)} · Gas CLP:{" "}
                  {peso(totalExpensesCLP)} · Neto CLP: {peso(netCLP)}
                </span>
              </summary>

              <div className={styles.accordionBody}>
                <Card title="Movimientos del mes">
                  <MonthMovements monthKey={key} />
                </Card>

                <Card title="Resumen del mes">
                  <MonthlySummary monthKey={key} />
                </Card>
              </div>
            </details>
          );
        })}
      </div>

      <Card
        title="Comparación global mes a mes"
        subtitle="Tendencias generales de gastos entre meses (en CLP)"
      >
        <MonthlyComparison />
      </Card>

    </div>
  );
};
