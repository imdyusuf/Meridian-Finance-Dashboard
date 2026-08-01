import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FileText, Printer } from "lucide-react";
import { getReports } from "@/services/api";
import { notify } from "@/store/appStore";
import { useI18n } from "@/hooks/useI18n";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Tabs } from "@/components/ui/Tabs";
import { ErrorState, Skeleton } from "@/components/common/States";
import { ChartTooltip } from "@/components/charts/ChartCard";
import {
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  todayISO,
} from "@/utils/format";
import { cn } from "@/utils/cn";

const PERIOD_TYPES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
];

export default function ReportsPage() {
  const { t, locale, currency } = useI18n();
  const [periodType, setPeriodType] = useState("monthly");
  const [period, setPeriod] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["reports", periodType, period],
    queryFn: () => getReports({ periodType, period: period || undefined }),
  });

  const handleExportPdf = () => {
    notify({ type: "info", title: "Preparing PDF…", message: "Open the print dialog to save or share the report." });
    window.setTimeout(() => window.print(), 400);
  };

  const switchType = (value) => {
    setPeriodType(value);
    setPeriod("");
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Generated on demand from your live ledger — export-ready."
        crumbs={[t("nav.reports")]}
        actions={
          <Button variant="secondary" icon={Printer} onClick={handleExportPdf} className="print:hidden">
            Export PDF
          </Button>
        }
      />

      {isError ? (
        <ErrorState onRetry={refetch} message="We couldn't generate this report." />
      ) : (
        <>
          <Card className="mb-4 flex flex-col gap-3 p-4 print:hidden sm:flex-row sm:items-center sm:justify-between">
            <Tabs tabs={PERIOD_TYPES} value={periodType} onChange={switchType} ariaLabel="Report period type" />
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-muted">Period</span>
              <Select
                aria-label="Report period"
                className="w-44"
                value={data?.period?.value ?? ""}
                onChange={(event) => setPeriod(event.target.value)}
              >
                {(data?.periods?.[periodType] ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </Card>

          {isLoading ? (
            <Card className="p-5" aria-hidden="true">
              <Skeleton className="h-5 w-52" />
              <Skeleton className="mt-2 h-3 w-40" />
              <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                ))}
              </div>
              <Skeleton className="mt-6 h-56 w-full" />
            </Card>
          ) : (
            <Card className="p-6 sm:p-8" id="report-body">
              {/* Report header */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand">
                    <FileText size={14} aria-hidden="true" />
                    {PERIOD_TYPES.find((type) => type.value === periodType)?.label} report
                  </p>
                  <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-ink">
                    {data.period.label}
                  </h2>
                  <p className="mt-1 text-[13px] text-muted">
                    Generated {formatDate(todayISO(), locale)} · Meridian Finance · All accounts
                  </p>
                </div>
                <Badge tone="success" dot>
                  Live data
                </Badge>
              </div>

              {/* KPIs */}
              <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <ReportKpi label="Income" value={data.totals.income} delta={data.compare.revenue} isPercent currency={currency} locale={locale} positiveIsGood />
                <ReportKpi label="Expenses" value={data.totals.expense} delta={data.compare.expense} isPercent currency={currency} locale={locale} positiveIsGood={false} />
                <ReportKpi label="Net profit" value={data.totals.net} delta={data.compare.net} isPercent={false} currency={currency} locale={locale} positiveIsGood />
                <ReportKpi
                  label="Margin"
                  value={data.totals.income > 0 ? formatPercent((data.totals.net / data.totals.income) * 100, locale) : "—"}
                  currency={currency}
                  locale={locale}
                  plain
                />
              </div>

              <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Category breakdown */}
                <div>
                  <h3 className="text-[15px] font-semibold text-ink">Expenses by category</h3>
                  <p className="mt-0.5 text-[13px] text-muted">Share of total spending in this period</p>
                  <ul className="mt-4 flex flex-col gap-3.5">
                    {data.categoryRows.map((row) => (
                      <li key={row.name}>
                        <div className="mb-1 flex items-center justify-between text-[13px]">
                          <span className="flex items-center gap-2 font-medium text-ink">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} aria-hidden="true" />
                            {row.name}
                          </span>
                          <span className="tabular-nums text-muted">
                            {formatCurrency(row.amount, currency, locale)}{" "}
                            <span className="text-faint">· {formatNumber(row.pct, locale, 1)}%</span>
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.min(100, row.pct)}%`, backgroundColor: row.color }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Monthly pattern */}
                {data.pattern.length > 1 && (
                  <div>
                    <h3 className="text-[15px] font-semibold text-ink">Monthly pattern</h3>
                    <p className="mt-0.5 text-[13px] text-muted">Income and expenses within this period</p>
                    <div className="mt-4 h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.pattern} margin={{ top: 5, right: 5, left: 0, bottom: 0 }} barGap={3}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--faint)" }} tickLine={false} axisLine={false} />
                          <YAxis
                            width={52}
                            tickFormatter={(value) => formatCompactCurrency(value, currency, locale)}
                            tick={{ fontSize: 11, fill: "var(--faint)" }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--line)" }} />
                          <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={22} />
                          <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={22} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              <p className="mt-8 border-t border-line pt-4 text-xs text-faint">
                Report generated from live data. Figures are rounded to the nearest dollar where applicable.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function ReportKpi({ label, value, delta, isPercent, currency, locale, positiveIsGood = true, plain = false }) {
  const good = plain || delta == null || (delta >= 0 ? positiveIsGood : !positiveIsGood);
  return (
    <div className="rounded-2xl border border-line bg-elevated/60 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">{label}</p>
      <p className="mt-1.5 text-lg font-bold text-ink tabular-nums">{value}</p>
      {!plain && delta != null && (
        <Badge tone={good ? "success" : "danger"} className="mt-2">
          {delta >= 0 ? "+" : ""}
          {isPercent ? formatPercent(delta, locale, 1) : formatCurrency(delta, currency, locale)} vs previous
        </Badge>
      )}
    </div>
  );
}
