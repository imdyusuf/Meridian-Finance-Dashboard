import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";

/**
 * Feature pages are lazy-loaded so each route ships its own chunk and the
 * initial bundle stays lean.
 */
const DashboardPage = lazy(() => import("@/features/dashboard/DashboardPage"));
const TransactionsPage = lazy(() => import("@/features/transactions/TransactionsPage"));
const BudgetsPage = lazy(() => import("@/features/budgets/BudgetsPage"));
const AnalyticsPage = lazy(() => import("@/features/analytics/AnalyticsPage"));
const InvestmentsPage = lazy(() => import("@/features/investments/InvestmentsPage"));
const GoalsPage = lazy(() => import("@/features/goals/GoalsPage"));
const ReportsPage = lazy(() => import("@/features/reports/ReportsPage"));
const CalendarPage = lazy(() => import("@/features/calendar/CalendarPage"));
const SettingsPage = lazy(() => import("@/features/settings/SettingsPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/budgets" element={<BudgetsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/investments" element={<InvestmentsPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
