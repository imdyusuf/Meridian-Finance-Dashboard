import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

/**
 * Accessible tab bar with arrow-key navigation and an animated active pill.
 */
export function Tabs({ tabs, value, onChange, className, ariaLabel = "Tabs" }) {
  const onKeyDown = (event) => {
    const index = tabs.findIndex((tab) => tab.value === value);
    let next = null;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    if (next !== null) {
      event.preventDefault();
      onChange(tabs[next].value);
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn("inline-flex items-center gap-1 rounded-xl border border-line bg-elevated p-1", className)}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.value)}
            className={cn(
              "relative rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
              active ? "text-ink" : "text-muted hover:text-ink"
            )}
          >
            {active && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 rounded-lg border border-line bg-surface shadow-sm"
                transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                aria-hidden="true"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon && <tab.icon size={14} aria-hidden="true" />}
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
