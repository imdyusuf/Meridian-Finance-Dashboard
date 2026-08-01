import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

const variants = {
  primary:
    "bg-brand text-white shadow-sm shadow-brand/30 hover:bg-brand-strong active:scale-[0.98]",
  secondary:
    "bg-surface text-ink border border-line-strong shadow-sm hover:bg-elevated active:scale-[0.98]",
  ghost: "text-muted hover:bg-elevated hover:text-ink",
  danger: "bg-danger text-white shadow-sm hover:brightness-110 active:scale-[0.98]",
  "danger-ghost": "text-danger hover:bg-danger-soft",
};

const sizes = {
  sm: "h-8 rounded-lg px-3 text-[13px] gap-1.5",
  md: "h-10 rounded-xl px-4 text-sm gap-2",
  lg: "h-11 rounded-xl px-5 text-sm gap-2",
};

export const Button = forwardRef(function Button(
  { variant = "primary", size = "md", icon: Icon, loading = false, className, children, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      className={cn(
        "inline-flex select-none items-center justify-center font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-60",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
      ) : Icon ? (
        <Icon size={16} aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
});

/** Square icon-only button with a mandatory accessible label. */
export function IconButton({ label, icon: Icon, size = 16, className, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-elevated hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        className
      )}
      {...props}
    >
      <Icon size={size} aria-hidden="true" />
    </button>
  );
}
