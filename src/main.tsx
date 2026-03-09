import React from 'react';
import ReactDOM from 'react-dom/client';
import { BudgetProvider } from './context/BudgetContext';
import { ExpensesDashboardPage } from './components/pages/ExpensesDashboardPage/ExpensesDashboardPage';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BudgetProvider>
      <ExpensesDashboardPage />
    </BudgetProvider>
  </React.StrictMode>
);

