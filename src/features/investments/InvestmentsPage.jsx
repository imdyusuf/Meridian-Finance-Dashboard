import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Coins, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import { getPortfolio } from "@/services/api";
import { useI18n } from "@/hooks/useI18n";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { ErrorState, Skeleton } from "@/components/common/States";
import { ChartCard, ChartTooltip, useChartPalette } from "@/components/charts/ChartCard";
import { formatCompactCurrency, formatCurrency, formatNumber, formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

const CLASS_TONES = {
  "US Equities": "brand",
  Tech: "info",
  Crypto: "warning",
  Bonds: "success",
  Dividends: "neutral",
};

export default function InvestmentsPage() {
  const { t, locale, currency } = useI18n();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["portfolio"],
    queryFn: getPortfolio,
  });

  return (
    <div>
      <PageHeader
        title="Investments"
        subtitle="Portfolio performance, allocation and holdings across your brokerage."
        crumbs={[t("nav.investments")]}
      />

      {isError ? (
        <ErrorState onRetry={refetch} message="We couldn't load your portfolio." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Portfolio value"
              value={formatCurrency(data?.totalValue, currency, locale)}
              delta={data?.dayChangePct}
              deltaLabel="today"
              icon={Wallet}
              iconTone="brand"
              loading={isLoading}
            />
            <StatCard
              label="Total gain"
              value={formatCurrency(data?.totalGain, currency, locale)}
              delta={data?.totalGainPct}
              deltaLabel="all time"
              icon={TrendingUp}
              iconTone="success"
              loading={isLoading}
            />
            <StatCard
              label="Today's change"
              value={formatCurrency(data?.dayChange, currency, locale)}
              delta={data?.dayChangePct}
              deltaLabel="vs yesterday"
              icon={Coins}
              iconTone="info"
              loading={isLoading}
            />
            <StatCard
              label="Est. annualized return"
              value={formatPercent(data?.annualized, locale, 1)}
              icon={PiggyBank}
              iconTone="warning"
              loading={isLoading}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
            <PerformanceChart data={data} loading={isLoading} currency={currency} locale={locale} />
            <AllocationDonut data={data} loading={isLoading} currency={currency} locale={locale} />
          </div>

          <Card className="mt-4">
            <div className="border-b border-line px-5 py-4">
              <h3 className="text-[15px] font-semibold text-ink">Holdings</h3>
              <p className="mt-0.5 text-[13px] text-muted">
                {data ? `${data.holdings.length} positions · cost basis ${formatCurrency(data.totalCost, currency, locale)}` : " "}
              </p>
            </div>
            {isLoading ? (
              <div className="flex flex-col gap-3 p-5" aria-hidden="true">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-11 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <THead>
                  <Tr>
                    <Th>Asset</Th>
                    <Th>Class</Th>
                    <Th className="text-right">Shares</Th>
                    <Th className="text-right">Price</Th>
                    <Th className="text-right">Market value</Th>
                    <Th className="text-right">7d</Th>
                    <Th className="text-right">Gain / loss</Th>
                  </Tr>
                </THead>
                <TBody>
                  {data.holdings.map((holding) => (
                    <Tr key={holding.id}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-bold",
                              holding.klass === "Crypto"
                                ? "bg-warning-soft text-warning"
                                : "bg-brand-soft text-brand"
                            )}
                          >
                            {holding.symbol.slice(0, 2)}
                          </span>
                          <span>
                            <span className="block font-medium text-ink">{holding.name}</span>
                            <span className="block text-xs text-faint">{holding.symbol}</span>
                          </span>
                        </div>
                      </Td>
                      <Td>
                        <Badge tone={CLASS_TONES[holding.klass] ?? "neutral"}>{holding.klass}</Badge>
                      </Td>
                      <Td className="text-right text-muted tabular-nums">
                        {formatNumber(holding.units, locale, holding.units < 10 ? 4 : 0)}
                      </Td>
                      <Td className="text-right tabular-nums">
                        {formatCurrency(holding.price, currency, locale)}
                      </Td>
                      <Td className="text-right font-medium tabular-nums">
                        {formatCurrency(holding.value, currency, locale)}
                      </Td>
                      <Td
                        className={cn(
                          "text-right tabular-nums",
                          holding.weekChangePct >= 0 ? "text-success" : "text-danger"
                        )}
                      >
                        {formatPercent(holding.weekChangePct, locale, 1, true)}
                      </Td>
                      <Td
                        className={cn(
                          "text-right font-medium tabular-nums",
                          holding.gain >= 0 ? "text-success" : "text-danger"
                        )}
                      >
                        {formatCurrency(holding.gain, currency, locale)}{" "}
                        <span className="text-xs">({formatPercent(holding.gainPct, locale, 1, true)})</span>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function PerformanceChart({ data, loading, currency, locale }) {
  const palette = useChartPalette();
  return (
    <ChartCard
      title="Performance"
      subtitle="Portfolio value vs S&P 500 (rebased to cost)"
      className="lg:col-span-3"
      action={
        <div className="flex items-center gap-4 text-xs font-medium text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" /> Portfolio
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-faint" aria-hidden="true" /> S&P 500
          </span>
        </div>
      }
    >
      {loading ? (
        <Skeleton className="h-72 w-full" />
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.series} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolio-value" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette.series.brand} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={palette.series.brand} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={palette.grid} />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => value.slice(5)}
                tick={{ fontSize: 11, fill: palette.axis }}
                tickLine={false}
                axisLine={false}
                minTickGap={42}
              />
              <YAxis
                width={64}
                tickFormatter={(value) => formatCompactCurrency(value, currency, locale)}
                tick={{ fontSize: 11, fill: palette.axis }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={<ChartTooltip labelFormatter={(label) => new Date(label).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })} />}
                cursor={{ stroke: palette.grid }}
              />
              <Area
                type="monotone"
                dataKey="value"
                name="Portfolio"
                stroke={palette.series.brand}
                strokeWidth={2.2}
                fill="url(#portfolio-value)"
              />
              <Area
                type="monotone"
                dataKey="benchmark"
                name="S&P 500"
                stroke={palette.series.slate}
                strokeWidth={1.6}
                strokeDasharray="4 3"
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

function AllocationDonut({ data, loading, currency, locale }) {
  return (
    <ChartCard title="Asset allocation" subtitle="By market value" className="lg:col-span-2">
      {loading ? (
        <Skeleton className="h-72 w-full" />
      ) : (
        <div className="flex h-full flex-col">
          <div className="relative mx-auto h-44 w-full max-w-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.allocation}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="90%"
                  paddingAngle={3}
                  stroke="none"
                >
                  {data.allocation.map((entry, index) => (
                    <Cell key={entry.name} fill={["#6366f1", "#0ea5e9", "#f59e0b", "#10b981", "#8b5cf6", "#f43f5e"][index % 6]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[11px] font-medium uppercase tracking-wide text-faint">Invested</p>
              <p className="text-lg font-bold text-ink tabular-nums">
                {formatCompactCurrency(data.totalValue, currency, locale)}
              </p>
            </div>
          </div>
          <ul className="mt-4 flex flex-col gap-1.5">
            {data.allocation.map((entry, index) => (
              <li key={entry.name} className="flex items-center justify-between rounded-lg px-2 py-1 text-[13px]">
                <span className="flex items-center gap-2 text-muted">
                  <span
                    className="h-2.5 w-2.5 rounded-[4px]"
                    style={{ backgroundColor: ["#6366f1", "#0ea5e9", "#f59e0b", "#10b981", "#8b5cf6", "#f43f5e"][index % 6] }}
                    aria-hidden="true"
                  />
                  {entry.name}
                </span>
                <span className="font-medium text-ink tabular-nums">
                  {formatNumber(entry.pct, locale, 1)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartCard>
  );
}
