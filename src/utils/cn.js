import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names and let tailwind-merge resolve conflicts
 * so callers can safely override default styles.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
