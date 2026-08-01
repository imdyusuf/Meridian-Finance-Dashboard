import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/common/States";
import { cn } from "@/utils/cn";

const toneClasses = {
  brand: "bg-brand-soft text-brand",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
};

/**
 * KPI card with delta chip and an optional inline sparkline.
 * `positiveIsGood` flips the delta coloring for metrics where down is good
 * (e.g. expenses).
 */
export function StatCard({
  label,
  value,
  delta,
  deltaLabel = "vs last month",
  icon: Icon,
  iconTone = "brand",
  spark = [],
  loading = false,
  positiveIsGood = true,
  className,
}) {
  if (loading) {
    return (
      <Card className={cn("p-5", className)} aria-hidden="true">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="mt-3 h-7 w-32" />
        <Skeleton className="mt-3 h-3 w-20" />
      </Card>
    );
  }

  const good = delta == null || (delta >= 0 ? positiveIsGood : !positiveIsGood);
  const chartData = spark.map((v, i) => ({ i, v }));
  const gradientId = `spark-${label.replace(/\W/g, "")}`;
  const sparkColor = good ? "#10b981" : "#f43f5e";

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        <span
          className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", toneClasses[iconTone])}
        >
          <Icon size={17} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-[26px] font-bold leading-none tracking-tight text-ink tabular-nums">
        {value}
      </p>
      <div className="mt-2.5 flex items-center gap-2">
        {delta != null && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums",
              good ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
            )}
          >
            {delta >= 0 ? (
              <ArrowUpRight size={12} aria-hidden="true" />
            ) : (
              <ArrowDownRight size={12} aria-hidden="true" />
            )}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        <span className="text-xs text-faint">{deltaLabel}</span>
      </div>
      {spark.length > 1 && (
        <div className="-mx-1 mt-3 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={sparkColor}
                strokeWidth={1.8}
                fill={`url(#${gradientId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
