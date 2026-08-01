import { useMemo } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { useAppStore } from "@/store/appStore";
import { useI18n } from "@/hooks/useI18n";
import { chartPalette } from "@/constants/theme";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";

/** Card shell for charts — consistent header, body and sizing. */
export function ChartCard({ title, subtitle, action, children, className, bodyClassName }) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader title={title} subtitle={subtitle} action={action} />
      <div className={cn("min-h-0 flex-1 px-5 pb-5", bodyClassName)}>{children}</div>
    </Card>
  );
}

/** Resolves the chart color palette against the active color scheme. */
export function useChartPalette() {
  const dark = useAppStore((state) => state.resolvedTheme === "dark");
  return useMemo(() => chartPalette(dark), [dark]);
}

/** Shared Recharts tooltip — formatted currency rows on a floating card. */
export function ChartTooltip({ active, payload, label, labelFormatter }) {
  const { currency, locale } = useI18n();
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-line bg-surface px-3.5 py-2.5 shadow-pop">
      <p className="mb-1.5 text-xs font-medium text-muted">
        {labelFormatter ? labelFormatter(label) : label}
      </p>
      <div className="flex flex-col gap-1">
        {payload.map((entry) => (
          <div key={String(entry.dataKey)} className="flex items-center justify-between gap-6 text-[13px]">
            <span className="flex items-center gap-1.5 text-muted">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: entry.color ?? entry.payload?.fill ?? "#6366f1" }}
                aria-hidden="true"
              />
              {entry.name}
            </span>
            <span className="font-semibold text-ink tabular-nums">
              {formatCurrency(entry.value, currency, locale)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
