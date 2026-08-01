/**
 * Locale-aware formatting helpers.
 *
 * All date helpers operate on ISO strings (YYYY-MM-DD) so the mock API layer
 * and the UI stay free of timezone surprises.
 */

const currencyFormatters = new Map();
const dateFormatters = new Map();
const numberFormatters = new Map();

function currencyFormatter(currency, locale, precision) {
  const key = `${currency}|${locale}|${precision}`;
  if (!currencyFormatters.has(key)) {
    currencyFormatters.set(
      key,
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      })
    );
  }
  return currencyFormatters.get(key);
}

function dateFormatter(locale, options) {
  const key = `${locale}|${JSON.stringify(options)}`;
  if (!dateFormatters.has(key)) {
    dateFormatters.set(key, new Intl.DateTimeFormat(locale, options));
  }
  return dateFormatters.get(key);
}

export function formatCurrency(value, currency = "USD", locale = "en-US") {
  const precision = Math.abs(value) >= 1000 ? 0 : 2;
  return currencyFormatter(currency, locale, precision).format(value);
}

export function formatCompactCurrency(value, currency = "USD", locale = "en-US") {
  const key = `${currency}|${locale}|compact`;
  if (!currencyFormatters.has(key)) {
    currencyFormatters.set(
      key,
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        notation: "compact",
        maximumFractionDigits: 1,
      })
    );
  }
  return currencyFormatters.get(key).format(value);
}

export function formatNumber(value, locale = "en-US", digits = 0) {
  const key = `${locale}|${digits}`;
  if (!numberFormatters.has(key)) {
    numberFormatters.set(
      key,
      new Intl.NumberFormat(locale, {
        maximumFractionDigits: digits,
      })
    );
  }
  return numberFormatters.get(key).format(value);
}

export function formatPercent(value, locale = "en-US", digits = 1, signed = false) {
  const prefix = signed && value > 0 ? "+" : "";
  return `${prefix}${formatNumber(value, locale, digits)}%`;
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO() {
  return toISODate(new Date());
}

export function monthKeyOf(iso) {
  return iso.slice(0, 7);
}

export function currentMonthKey() {
  return todayISO().slice(0, 7);
}

export function addMonths(key, delta) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function startOfMonthISO(key) {
  return `${key}-01`;
}

export function daysInMonth(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

/** Monday-based index of the first day of a month (0 = Monday). */
export function firstWeekday(key) {
  const [y, m] = key.split("-").map(Number);
  return (new Date(y, m - 1, 1).getDay() + 6) % 7;
}

export function formatDate(iso, locale = "en-US") {
  if (!iso) return "—";
  return dateFormatter(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parseISO(iso));
}

export function formatShortDate(iso, locale = "en-US") {
  if (!iso) return "—";
  return dateFormatter(locale, { month: "short", day: "numeric" }).format(
    parseISO(iso)
  );
}

export function formatLongDate(date, locale = "en-US") {
  return dateFormatter(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function monthLabel(key, locale = "en-US") {
  if (!key) return "—";
  return dateFormatter(locale, { month: "long", year: "numeric" }).format(
    parseISO(`${key}-01`)
  );
}

export function shortMonthLabel(key, locale = "en-US") {
  if (!key) return "—";
  return dateFormatter(locale, { month: "short" }).format(parseISO(`${key}-01`));
}

const WEEKDAY_LABELS = {
  "en-US": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  "es-ES": ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
};

export function weekdayLabels(locale = "en-US") {
  return WEEKDAY_LABELS[locale] ?? WEEKDAY_LABELS["en-US"];
}

export function daysBetween(fromISO, toISO) {
  return Math.round((parseISO(toISO) - parseISO(fromISO)) / 86_400_000);
}

export function daysUntil(iso) {
  return daysBetween(todayISO(), iso);
}

/** "Today" / "In 4 days" / "Overdue by 2 days" — used for bills. */
export function dueLabel(iso) {
  const days = daysUntil(iso);
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days > 1) return `Due in ${days} days`;
  return `Overdue by ${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"}`;
}

/** "Today" / "In 4 days" / "3 days ago" — used for reminders. */
export function relativeLabel(iso) {
  const days = daysUntil(iso);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 1) return `In ${days} days`;
  return `${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"} ago`;
}
