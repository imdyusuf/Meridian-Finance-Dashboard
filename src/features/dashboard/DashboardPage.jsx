import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  CalendarClock,
  PiggyBank,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { getDashboard } from "@/services/api";
import { useI18n } from "@/hooks/useI18n";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card, CardContent, CardHeader, Progress } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, Skeleton } from "@/components/common/States";
import { ChartCard, ChartTooltip, useChartPalette } from "@/components/charts/ChartCard";
import { CategoryIcon } from "@/constants";
import { useAppStore } from "@/store/appStore";
import {
  currentMonthKey,
  dueLabel,
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatPercent,
  monthLabel,
} from "@/utils/format";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { t, locale, currency } = useI18n();
  const profile = useAppStore((state) => state.profile);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  const currentLabel = monthLabel(currentMonthKey(), locale);
  const firstName = profile.name.split(" ")[0];

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        subtitle={`Here's what's happening with your money in ${currentLabel}.`}
        crumbs={[t("common.overview")]}
        actions={
          <Link to="/transactions?new=1">
            <Button icon={Plus}>
              {t("common.add")} transaction
            </Button>
          </Link>
        }
      />

      {isError ? (
        <ErrorState onRetry={refetch} message="We couldn't load your financial summary." />
      ) : (
        <>
          <KpiRow data={data} loading={isLoading} currency={currency} locale={locale} />

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <CashFlowPanel data={data} loading={isLoading} currency={currency} locale={locale} />
            <BudgetPanel data={data} loading={isLoading} currency={currency} locale={locale} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <RecentTransactions data={data} loading={isLoading} currency={currency} locale={locale} />
            <UpcomingBills data={data} loading={isLoading} currency={currency} locale={locale} />
          </div>
        </>
      )}
    </div>
  );
}

function KpiRow({ data, loading, currency, locale }) {
  const savingsRate = data?.current?.income > 0 ? (data.current.net / data.current.income) * 100 : 0;
  const netSpark = data?.series?.slice(-8).map((m) => m.net) ?? [];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total balance"
        value={formatCurrency(data?.totalBalance, currency, locale)}
        delta={data?.deltas.net}
        icon={Wallet}
        iconTone="brand"
        spark={netSpark}
        loading={loading}
      />
      <StatCard
        label="Revenue this month"
        value={formatCurrency(data?.current?.income, currency, locale)}
        delta={data?.deltas.revenue}
        icon={TrendingUp}
        iconTone="success"
        spark={data?.series.map((m) => m.income) ?? []}
        loading={loading}
      />
      <StatCard
        label="Expenses this month"
        value={formatCurrency(data?.current?.expense, currency, locale)}
        delta={data?.deltas.expense}
        icon={TrendingDown}
        iconTone="danger"
        positiveIsGood={false}
        spark={data?.series.map((m) => m.expense) ?? []}
        loading={loading}
      />
      <StatCard
        label="Savings rate"
        value={formatPercent(savingsRate, locale)}
        delta={data?.deltas.savingsRate}
        icon={PiggyBank}
        iconTone="info"
        loading={loading}
      />
    </div>
  );
}

function CashFlowPanel({ data, loading, currency, locale }) {
  const palette = useChartPalette();
  const series = data?.series ?? [];

  return (
    <ChartCard
      title="Cash flow"
      subtitle="Income vs expenses, trailing 12 months"
      className="lg:col-span-2"
      action={
        <div className="flex items-center gap-4 text-xs font-medium text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
            Revenue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-danger" aria-hidden="true" />
            Expenses
          </span>
        </div>
      }
    >
      {loading ? (
        <Skeleton className="h-72 w-full" />
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cashflow-income" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette.series.emerald} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={palette.series.emerald} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cashflow-expense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette.series.rose} stopOpacity={0.24} />
                  <stop offset="100%" stopColor={palette.series.rose} stopOpacity={0} />
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
              <Area
                type="monotone"
                dataKey="income"
                name="Revenue"
                stroke={palette.series.emerald}
                strokeWidth={2.2}
                fill="url(#cashflow-income)"
              />
              <Area
                type="monotone"
                dataKey="expense"
                name="Expenses"
                stroke={palette.series.rose}
                strokeWidth={2.2}
                fill="url(#cashflow-expense)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

function BudgetPanel({ data, loading, currency, locale }) {
  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Budget status"
        subtitle="Top categories this month"
        action={
          <Link
            to="/budgets"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand transition-colors hover:text-brand-strong"
          >
            View all <ArrowRight size={13} aria-hidden="true" />
          </Link>
        }
      />
      <CardContent className="flex-1">
        {loading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !data?.budgetStatus?.length ? (
          <EmptyState
            title="No budgets yet"
            description="Set monthly limits to start tracking spending."
            action={
              <Link to="/budgets">
                <Button variant="secondary" size="sm" icon={Plus}>
                  Create a budget
                </Button>
              </Link>
            }
          />
        ) : (
          <ul className="flex flex-col gap-4">
            {data.budgetStatus.map((budget) => (
              <li key={budget.categoryId}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${budget.category.color}1f`, color: budget.category.color }}
                    >
                      <CategoryIcon icon={budget.category.icon} size={14} />
                    </span>
                    <span className="truncate text-[13px] font-medium text-ink">
                      {budget.category.name}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted tabular-nums">
                    <span className="font-semibold text-ink">
                      {formatCurrency(budget.spent, currency, locale)}
                    </span>{" "}
                    / {formatCurrency(budget.limit, currency, locale)}
                  </span>
                </div>
                <Progress value={budget.pct} tone="auto" size="sm" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function RecentTransactions({ data, loading, currency, locale }) {
  return (
    <Card className="flex flex-col lg:col-span-2">
      <CardHeader
        title="Recent transactions"
        subtitle="Latest activity across all accounts"
        action={
          <Link
            to="/transactions"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand transition-colors hover:text-brand-strong"
          >
            View all <ArrowRight size={13} aria-hidden="true" />
          </Link>
        }
      />
      <CardContent className="flex-1">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : !data?.recent?.length ? (
          <EmptyState
            icon={Receipt}
            title="No transactions yet"
            description="Once money moves, it will show up here."
          />
        ) : (
          <ul className="flex flex-col">
            {data.recent.map((transaction) => (
              <li key={transaction.id}>
                <Link
                  to="/transactions"
                  className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-elevated"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${transaction.categoryColor}1f`,
                      color: transaction.categoryColor,
                    }}
                  >
                    <CategoryIcon icon={transaction.categoryIcon} size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium text-ink">
                      {transaction.description}
                    </span>
                    <span className="block text-xs text-faint">
                      {transaction.categoryName} · {formatDate(transaction.date, locale)}
                    </span>
                  </span>
                  <span
                    className={
                      transaction.type === "income"
                        ? "text-[13.5px] font-semibold text-success tabular-nums"
                        : "text-[13.5px] font-semibold text-ink tabular-nums"
                    }
                  >
                    {transaction.type === "income" ? "+" : "−"}
                    {formatCurrency(transaction.amount, currency, locale)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function UpcomingBills({ data, loading, currency, locale }) {
  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Upcoming bills"
        subtitle="Next 30 days"
        action={<CalendarClock size={16} className="text-faint" aria-hidden="true" />}
      />
      <CardContent className="flex-1">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !data?.upcomingBills?.length ? (
          <EmptyState
            icon={CalendarClock}
            title="Nothing due"
            description="No bills are due in the next month."
          />
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {data.upcomingBills.map((bill) => (
              <li key={bill.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-ink">{bill.name}</span>
                  <span className="text-xs text-faint">{bill.category}</span>
                </span>
                <Badge tone={bill.dueDays < 0 ? "danger" : bill.dueDays <= 3 ? "warning" : "neutral"}>
                  {dueLabel(bill.due)}
                </Badge>
                <span className="w-24 text-right text-[13.5px] font-semibold text-ink tabular-nums">
                  {formatCurrency(bill.amount, currency, locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {data?.summary && (
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
            <div>
              <p className="text-xs text-faint">Cash runway</p>
              <p className="mt-0.5 text-[15px] font-bold text-ink tabular-nums">
                {data.summary.runwayMonths.toFixed(1)}{" "}
                <span className="text-xs font-medium text-muted">months</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-faint">Avg. monthly net</p>
              <p className="mt-0.5 text-[15px] font-bold text-ink tabular-nums">
                {formatCurrency(data.summary.avgMonthlyNet, currency, locale)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
