import { useQuery } from "@tanstack/react-query";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Award, PiggyBank, TrendingDown, TrendingUp } from "lucide-react";
import { getAnalytics } from "@/services/api";
import { useI18n } from "@/hooks/useI18n";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ErrorState, Skeleton } from "@/components/common/States";
import { ChartCard, ChartTooltip, useChartPalette } from "@/components/charts/ChartCard";
import { formatCompactCurrency, formatCurrency, formatPercent } from "@/utils/format";

export default function AnalyticsPage() {
  const { t, locale, currency } = useI18n();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["analytics"],
    queryFn: getAnalytics,
  });

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Twelve months of revenue, expenses and forward-looking trends."
        crumbs={[t("nav.analytics")]}
      />

      {isError ? (
        <ErrorState onRetry={refetch} message="We couldn't compute your analytics." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Avg. monthly revenue"
              value={formatCurrency(data?.insights.avgRevenue, currency, locale)}
              icon={TrendingUp}
              iconTone="success"
              loading={isLoading}
            />
            <StatCard
              label="Avg. monthly expenses"
              value={formatCurrency(data?.insights.avgExpense, currency, locale)}
              icon={TrendingDown}
              iconTone="danger"
              loading={isLoading}
            />
            <StatCard
              label="Savings rate"
              value={formatPercent((data?.insights.savingsRate ?? 0) * 100, locale)}
              icon={PiggyBank}
              iconTone="info"
              loading={isLoading}
            />
            <StatCard
              label="Best month"
              value={formatCurrency(data?.insights.bestMonth?.net, currency, locale)}
              deltaLabel={data?.insights.bestMonth?.label ?? ""}
              icon={Award}
              iconTone="warning"
              loading={isLoading}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
            <IncomeExpenseChart data={data} loading={isLoading} currency={currency} locale={locale} />
            <CategoryDonut data={data} loading={isLoading} currency={currency} locale={locale} />
          </div>

          <div className="mt-4">
            <ForecastChart data={data} loading={isLoading} currency={currency} locale={locale} />
          </div>
        </>
      )}
    </div>
  );
}

function IncomeExpenseChart({ data, loading, currency, locale }) {
  const palette = useChartPalette();
  return (
    <ChartCard
      title="Income vs expenses"
      subtitle="Monthly comparison"
      className="lg:col-span-3"
      action={
        <div className="flex items-center gap-4 text-xs font-medium text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" /> Income
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-danger" aria-hidden="true" /> Expenses
          </span>
        </div>
      }
    >
      {loading ? (
        <Skeleton className="h-72 w-full" />
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.series} margin={{ top: 5, right: 5, left: 0, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={palette.grid} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: palette.axis }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                width={56}
                tickFormatter={(value) => formatCompactCurrency(value, currency, locale)}
                tick={{ fontSize: 11, fill: palette.axis }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: palette.cursor }} />
              <Bar dataKey="income" name="Income" fill={palette.series.emerald} radius={[5, 5, 0, 0]} maxBarSize={16} />
              <Bar dataKey="expense" name="Expenses" fill={palette.series.rose} radius={[5, 5, 0, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

function CategoryDonut({ data, loading, currency, locale }) {
  const palette = useChartPalette();
  const total = data?.breakdown?.reduce((sum, item) => sum + item.amount, 0) ?? 0;

  return (
    <ChartCard title="Spending by category" subtitle="Trailing 12 months" className="lg:col-span-2">
      {loading ? (
        <Skeleton className="h-72 w-full" />
      ) : (
        <div className="flex h-full flex-col">
          <div className="relative mx-auto h-48 w-full max-w-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.breakdown}
                  dataKey="amount"
                  nameKey="name"
                  innerRadius="64%"
                  outerRadius="88%"
                  paddingAngle={2}
                  stroke="none"
                  isAnimationActive={true}
                >
                  {data.breakdown.map((entry) => (
                    <Cell key={entry.categoryId} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[11px] font-medium uppercase tracking-wide text-faint">Total spend</p>
              <p className="text-lg font-bold text-ink tabular-nums">
                {formatCompactCurrency(total, currency, locale)}
              </p>
            </div>
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-1.5">
            {data.breakdown.map((entry) => (
              <li
                key={entry.categoryId}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-1 text-[13px]"
              >
                <span className="flex min-w-0 items-center gap-2 text-muted">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-[4px]"
                    style={{ backgroundColor: entry.color }}
                    aria-hidden="true"
                  />
                  <span className="truncate">{entry.name}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2 tabular-nums">
                  <span className="font-medium text-ink">{formatCurrency(entry.amount, currency, locale)}</span>
                  <span className="w-10 text-right text-xs text-faint">
                    {total > 0 ? ((entry.amount / total) * 100).toFixed(1) : 0}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartCard>
  );
}

function ForecastChart({ data, loading, currency, locale }) {
  const palette = useChartPalette();
  const chartData = [
    ...(data?.series ?? []).map((month) => ({ label: month.label, net: month.net, projected: null })),
    ...(data?.forecast ?? []).map((month) => ({ label: month.label, net: null, projected: month.net })),
  ];

  return (
    <ChartCard
      title="Net cash flow & forecast"
      subtitle="Three-month linear projection based on the last six months"
      action={
        <div className="flex items-center gap-4 text-xs font-medium text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" /> Net cash flow
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full border-t-2 border-dashed border-brand" aria-hidden="true" />
            Forecast
          </span>
        </div>
      }
    >
      {loading ? (
        <Skeleton className="h-72 w-full" />
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="forecast-net" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette.series.emerald} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={palette.series.emerald} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={palette.grid} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: palette.axis }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                width={56}
                tickFormatter={(value) => formatCompactCurrency(value, currency, locale)}
                tick={{ fontSize: 11, fill: palette.axis }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: palette.grid }} />
              <ReferenceLine y={0} stroke={palette.grid} strokeWidth={1.5} />
              <Area
                type="monotone"
                dataKey="net"
                name="Net cash flow"
                stroke={palette.series.emerald}
                strokeWidth={2.2}
                fill="url(#forecast-net)"
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="projected"
                name="Forecast"
                stroke={palette.series.brand}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={{ r: 3, fill: palette.series.brand, strokeWidth: 0 }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
