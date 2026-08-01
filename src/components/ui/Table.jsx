import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/utils/cn";

export function Table({ className, children }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[680px] border-collapse text-left">{children}</table>
    </div>
  );
}

export function THead({ className, children }) {
  return <thead className={cn("border-b border-line bg-elevated/70", className)}>{children}</thead>;
}

export function TBody({ className, children }) {
  return <tbody className={cn("divide-y divide-line", className)}>{children}</tbody>;
}

export function Tr({ className, children, ...props }) {
  return (
    <tr className={cn("transition-colors hover:bg-elevated/50", className)} {...props}>
      {children}
    </tr>
  );
}

export function Th({ className, children }) {
  return (
    <th
      scope="col"
      className={cn("whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-faint", className)}
    >
      {children}
    </th>
  );
}

export function Td({ className, children }) {
  return <td className={cn("whitespace-nowrap px-4 py-3.5 text-sm text-ink", className)}>{children}</td>;
}

/** Clickable column header that reports its sort state to screen readers. */
export function SortableTh({ label, sortKey, sort, onSort, className }) {
  const active = sort.key === sortKey;
  return (
    <Th className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-faint transition-colors hover:text-ink"
      >
        {label}
        {active ? (
          sort.dir === "asc" ? (
            <ArrowUp size={12} aria-hidden="true" />
          ) : (
            <ArrowDown size={12} aria-hidden="true" />
          )
        ) : (
          <ArrowUpDown size={12} className="opacity-40" aria-hidden="true" />
        )}
      </button>
    </Th>
  );
}

function pageWindow(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  const pages = [1];
  if (start > 2) pages.push("ellipsis-left");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push("ellipsis-right");
  pages.push(total);
  return pages;
}

export function Pagination({ page, pageSize, total, onChange, className }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const go = (p) => {
    const next = Math.max(1, Math.min(pages, p));
    if (next !== page) onChange(next);
  };

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <p className="text-[13px] text-muted">
        Showing <span className="font-medium text-ink">{from}–{to}</span> of{" "}
        <span className="font-medium text-ink">{total}</span>
      </p>
      <nav aria-label="Pagination" className="flex items-center gap-1">
        <button
          type="button"
          aria-label="First page"
          disabled={page <= 1}
          onClick={() => go(1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-elevated hover:text-ink disabled:opacity-40"
        >
          <ChevronsLeft size={15} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => go(page - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-elevated hover:text-ink disabled:opacity-40"
        >
          <ChevronLeft size={15} aria-hidden="true" />
        </button>
        {pageWindow(page, pages).map((entry, i) =>
          entry === "ellipsis-left" || entry === "ellipsis-right" ? (
            <span key={`${entry}-${i}`} className="px-1 text-xs text-faint" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              aria-label={`Page ${entry}`}
              aria-current={entry === page ? "page" : undefined}
              onClick={() => go(entry)}
              className={cn(
                "h-8 min-w-8 rounded-lg px-1.5 text-[13px] font-medium transition-colors",
                entry === page
                  ? "bg-brand text-white"
                  : "text-muted hover:bg-elevated hover:text-ink"
              )}
            >
              {entry}
            </button>
          )
        )}
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => go(page + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-elevated hover:text-ink disabled:opacity-40"
        >
          <ChevronRight size={15} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Last page"
          disabled={page >= pages}
          onClick={() => go(pages)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-elevated hover:text-ink disabled:opacity-40"
        >
          <ChevronsRight size={15} aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}
