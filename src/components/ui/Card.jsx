import { cn } from "@/utils/cn";

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn("rounded-2xl border border-line bg-surface shadow-card", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pb-4 pt-5", className)}>
      <div className="min-w-0">
        {title && <h3 className="text-[15px] font-semibold text-ink">{title}</h3>}
        {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardContent({ className, children }) {
  return <div className={cn("px-5 pb-5", className)}>{children}</div>;
}

/**
 * Progress bar with semantic coloring.
 * tone="auto" derives color from the percentage (success / warning / danger).
 */
export function Progress({ value, tone = "auto", size = "md", className }) {
  const pct = Math.max(0, Math.min(100, value));
  const toneClasses = {
    auto: pct >= 100 ? "bg-danger" : pct >= 85 ? "bg-warning" : "bg-success",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    brand: "bg-brand",
  };
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "w-full overflow-hidden rounded-full bg-line",
        size === "sm" ? "h-1.5" : "h-2.5",
        className
      )}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500 ease-out", toneClasses[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
