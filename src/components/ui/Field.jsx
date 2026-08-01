import { forwardRef, useId } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";

const controlBase =
  "w-full rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink placeholder:text-faint transition-all duration-150 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60";

const errorClasses = "border-danger focus:border-danger focus:ring-danger/15";

function FieldText({ id, error, hint }) {
  if (error) {
    return (
      <p id={`${id}-error`} role="alert" className="flex items-center gap-1 text-xs font-medium text-danger">
        <AlertCircle size={12} aria-hidden="true" />
        {error}
      </p>
    );
  }
  if (hint) return <p className="text-xs text-faint">{hint}</p>;
  return null;
}

export const Input = forwardRef(function Input(
  { label, error, hint, className, id, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-medium text-ink">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${inputId}-error` : undefined}
        className={cn(controlBase, "h-10", error && errorClasses, className)}
        {...props}
      />
      <FieldText id={inputId} error={error} hint={hint} />
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, className, id, rows = 3, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-medium text-ink">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${inputId}-error` : undefined}
        className={cn(controlBase, "py-2.5", error && errorClasses, className)}
        {...props}
      />
      <FieldText id={inputId} error={error} hint={hint} />
    </div>
  );
});

export const Select = forwardRef(function Select(
  { label, error, hint, className, id, children, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={cn(controlBase, "h-10 appearance-none pr-9", error && errorClasses, className)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint"
        />
      </div>
      <FieldText id={inputId} error={error} hint={hint} />
    </div>
  );
});

/** Accessible toggle switch. */
export function Switch({ checked, onChange, label, description, disabled }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-4",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-ink">{label}</span>
        {description && <span className="text-[13px] leading-snug text-muted">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
          checked ? "bg-brand" : "bg-line-strong"
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked && "translate-x-5"
          )}
        />
      </button>
    </label>
  );
}
