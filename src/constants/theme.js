/**
 * Chart theming. Colors are resolved against the active color scheme so
 * charts re-render cleanly when the user toggles dark mode.
 */
export function chartPalette(dark) {
  return {
    grid: dark ? "#222a3a" : "#ecedf2",
    axis: dark ? "#8b95a9" : "#98a1b3",
    cursor: dark ? "rgba(255, 255, 255, 0.06)" : "rgba(16, 24, 40, 0.05)",
    series: {
      brand: "#6366f1",
      violet: "#8b5cf6",
      emerald: "#10b981",
      rose: "#f43f5e",
      amber: "#f59e0b",
      sky: "#0ea5e9",
      cyan: "#14b8a6",
      slate: dark ? "#48536b" : "#c3c9d6",
    },
  };
}

/** Deterministic color rotation for category breakdowns and allocation. */
export const CATEGORY_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#14b8a6",
  "#a855f7",
  "#84cc16",
  "#f97316",
  "#06b6d4",
  "#64748b",
];
