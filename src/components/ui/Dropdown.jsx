import { cloneElement, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/utils/cn";

/**
 * Menu anchored to a trigger element. Closes on outside click and Escape,
 * and each item announces itself as a menu item to assistive tech.
 */
export function Dropdown({ trigger, items, align = "end", menuClassName }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      {cloneElement(trigger, {
        onClick: () => setOpen((value) => !value),
        "aria-expanded": open,
        "aria-haspopup": "menu",
      })}
      <AnimatePresence>
        {open && (
          <motion.ul
            role="menu"
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.12 }}
            className={cn(
              "absolute z-50 mt-1.5 min-w-44 rounded-xl border border-line bg-surface p-1.5 shadow-pop",
              align === "end" ? "right-0" : "left-0",
              menuClassName
            )}
          >
            {items.map((item, index) =>
              item.separator ? (
                <li key={`sep-${index}`} className="mx-2 my-1.5 h-px bg-line" aria-hidden="true" />
              ) : (
                <li key={item.label ?? index}>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={() => {
                      setOpen(false);
                      item.onClick?.();
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50",
                      item.tone === "danger" ? "text-danger hover:bg-danger-soft" : "text-ink hover:bg-elevated"
                    )}
                  >
                    {item.icon && <item.icon size={15} aria-hidden="true" />}
                    {item.label}
                  </button>
                </li>
              )
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
