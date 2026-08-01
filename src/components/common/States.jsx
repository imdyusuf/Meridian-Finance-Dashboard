import { AlertTriangle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

/* Skeleton primitives — shimmer-free pulse blocks that respect the theme. */

export function Skeleton({ className }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-lg bg-line", className)} />;
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div aria-hidden="true" className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn("h-3.5", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-elevated text-faint">
        <Icon size={22} aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Couldn't load this data", message, onRetry, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <AlertTriangle size={22} aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted">
        {message ?? "Something went wrong while fetching this data. Please try again."}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** Suspense fallback that mirrors the dashboard skeleton layout. */
export function PageLoader() {
  return (
    <div className="flex flex-col gap-6 py-2" aria-hidden="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="mt-3 h-7 w-32" />
            <Skeleton className="mt-3 h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card lg:col-span-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-5 h-56 w-full" />
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-5 h-56 w-full" />
        </div>
      </div>
    </div>
  );
}
