import { ChevronRight } from "lucide-react";
import { APP_NAME } from "@/constants";
import { cn } from "@/utils/cn";

export function PageHeader({ title, subtitle, crumbs = [], actions, className }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 pb-6 pt-2 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className="mb-1.5 flex items-center gap-1 text-xs text-faint">
          <span>{APP_NAME}</span>
          {crumbs.map((crumb) => (
            <span key={crumb} className="flex items-center gap-1">
              <ChevronRight size={12} aria-hidden="true" />
              <span className="font-medium text-muted">{crumb}</span>
            </span>
          ))}
        </nav>
        <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}
