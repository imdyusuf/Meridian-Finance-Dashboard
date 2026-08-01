import { addMonths, currentMonthKey, monthKeyOf, toISODate } from "@/utils/format";

/**
 * Seed ledger for local development. A deterministic PRNG keeps the data
 * stable across reloads while still looking organic. Everything here is
 * built at module load and served by the in-memory API layer.
 */

const SEED = 0x5eed2026;

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(SEED);
const rand = (min, max) => min + rng() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const chance = (p) => rng() < p;
const gauss = () => (rng() + rng() + rng() + rng() - 2) / 2;

/* ------------------------------------------------------------------ */
/* Reference data                                                      */
/* ------------------------------------------------------------------ */

export const accounts = [
  { id: "acc-business", name: "Business Checking", institution: "Mercury", type: "business", balance: 86420.37 },
  { id: "acc-checking", name: "Everyday Checking", institution: "US Bank", type: "checking", balance: 18420.55 },
  { id: "acc-savings", name: "High-Yield Savings", institution: "Ally", type: "savings", balance: 52310.4 },
  { id: "acc-credit", name: "Venture Card", institution: "Chase", type: "credit", balance: -3420.87 },
  { id: "acc-brokerage", name: "Brokerage", institution: "Fidelity", type: "investment", balance: 0 },
];

export const customers = [
  "Brightline Media",
  "Northwind Labs",
  "Lumen Studio",
  "Praxis Health",
  "VectorWorks",
  "Corey & Co.",
  "Atlas Freight",
  "Harbor & Finch",
];

export const categories = [
  // Income
  { id: "cat-revenue", name: "Client Revenue", type: "income", color: "#6366f1", icon: "banknote" },
  { id: "cat-salary", name: "Salary", type: "income", color: "#0ea5e9", icon: "wallet" },
  { id: "cat-refunds", name: "Refunds", type: "income", color: "#10b981", icon: "gift" },
  { id: "cat-investment", name: "Investment Income", type: "income", color: "#8b5cf6", icon: "trending" },
  // Expenses
  { id: "cat-software", name: "Software & Tools", type: "expense", color: "#6366f1", icon: "code" },
  { id: "cat-rent", name: "Rent & Office", type: "expense", color: "#8b5cf6", icon: "home" },
  { id: "cat-payroll", name: "Payroll", type: "expense", color: "#0ea5e9", icon: "users" },
  { id: "cat-marketing", name: "Marketing", type: "expense", color: "#f59e0b", icon: "megaphone" },
  { id: "cat-travel", name: "Travel", type: "expense", color: "#f43f5e", icon: "plane" },
  { id: "cat-meals", name: "Meals & Dining", type: "expense", color: "#f97316", icon: "utensils" },
  { id: "cat-office", name: "Office & Supplies", type: "expense", color: "#14b8a6", icon: "briefcase" },
  { id: "cat-utilities", name: "Utilities", type: "expense", color: "#84cc16", icon: "zap" },
  { id: "cat-insurance", name: "Insurance", type: "expense", color: "#a855f7", icon: "shield" },
  { id: "cat-equipment", name: "Equipment", type: "expense", color: "#06b6d4", icon: "monitor" },
  { id: "cat-subscriptions", name: "Subscriptions", type: "expense", color: "#64748b", icon: "repeat" },
  { id: "cat-transport", name: "Transportation", type: "expense", color: "#eab308", icon: "car" },
  { id: "cat-health", name: "Health & Fitness", type: "expense", color: "#ec4899", icon: "heart" },
  { id: "cat-misc", name: "Other", type: "expense", color: "#94a3b8", icon: "dots" },
];

const MERCHANTS = {
  "cat-software": ["Vercel", "AWS", "Figma", "Notion", "Linear", "GitHub", "Slack", "Sentry", "Intercom", "Airtable", "Webflow"],
  "cat-rent": ["WeWork — SOMA", "525 Market St. Office", "Regus — FiDi"],
  "cat-payroll": ["Payroll — Direct Deposit", "Gusto — Payroll Run"],
  "cat-marketing": ["Google Ads", "Meta Ads", "LinkedIn Ads", "Newsletter Sponsorship", "PR Kit Printing"],
  "cat-travel": ["Delta Air Lines", "United Airlines", "Marriott", "Airbnb", "Amtrak", "Hertz"],
  "cat-meals": ["The Coffee Roastery", "Sweetgreen", "Chipotle", "Blue Bottle", "Tartine", "DoorDash", "Sushi Zone", "Nopa", "Dumpling House"],
  "cat-office": ["Staples", "Amazon", "IKEA", "The Container Store", "Office Depot"],
  "cat-utilities": ["PG&E", "Comcast", "AT&T", "Verizon"],
  "cat-insurance": ["State Farm", "Delta Dental", "MetLife"],
  "cat-equipment": ["Apple", "Best Buy", "B&H Photo", "Dell"],
  "cat-subscriptions": ["Netflix", "Spotify", "iCloud+", "The New York Times", "Audible", "YouTube Premium", "Dropbox"],
  "cat-transport": ["Uber", "Lyft", "Shell", "Chevron", "Muni"],
  "cat-health": ["CVS", "Walgreens", "One Medical", "Equinox", "Kaiser"],
  "cat-misc": ["Target", "Costco", "Trader Joe's", "Nike", "REI", "Bookshop.org"],
};

/* ------------------------------------------------------------------ */
/* Transactions — 14 months of believable business activity            */
/* ------------------------------------------------------------------ */

let txnSeq = 0;
const nextId = () => `txn-${String(++txnSeq).padStart(4, "0")}`;

function generateTransactions() {
  const result = [];
  const now = new Date();
  const endKey = currentMonthKey();
  const months = [];
  for (let i = 13; i >= 0; i--) months.push(addMonths(endKey, -i));

  let invoiceNumber = 1041;

  months.forEach((monthKey) => {
    const [year, month] = monthKey.split("-").map(Number);
    const days = new Date(year, month, 0).getDate();
    const day = (min, max) => Math.min(days, randInt(min, max));
    const push = (entry) => {
      const { day: fixedDay, ...rest } = entry;
      result.push({
        id: nextId(),
        date: `${monthKey}-${String(fixedDay ?? day(1, days)).padStart(2, "0")}`,
        status: "cleared",
        ...rest,
      });
    };

    // Income — 3–5 client invoices
    const invoiceCount = randInt(3, 5);
    for (let i = 0; i < invoiceCount; i++) {
      const amount = Math.round(rand(3400, 14800) * 100) / 100;
      push({
        description: `Invoice #${invoiceNumber++} — ${pick(customers)}`,
        merchant: "Stripe payout",
        categoryId: "cat-revenue",
        accountId: "acc-business",
        type: "income",
        amount,
      });
    }

    // Salary draw on the 28th
    push({
      date: `${monthKey}-28`,
      description: "Payroll — Founder Draw",
      merchant: "Mercury",
      categoryId: "cat-salary",
      accountId: "acc-business",
      type: "income",
      amount: 8500,
    });

    // Occasional refunds and dividend income
    if (chance(0.14)) {
      push({
        description: "Refund — vendor credit",
        merchant: pick(["Amazon", "Apple", "Delta Air Lines"]),
        categoryId: "cat-refunds",
        accountId: "acc-credit",
        type: "income",
        amount: Math.round(rand(40, 260) * 100) / 100,
      });
    }
    if (chance(0.08)) {
      push({
        description: "Dividend — VOO",
        merchant: "Fidelity",
        categoryId: "cat-investment",
        accountId: "acc-brokerage",
        type: "income",
        amount: Math.round(rand(120, 640) * 100) / 100,
      });
    }

    // Fixed recurring expenses
    const recurring = [
      { categoryId: "cat-rent", amount: 4200, merchant: "WeWork — SOMA", day: 1, accountId: "acc-business" },
      { categoryId: "cat-payroll", amount: 11800, merchant: "Gusto — Payroll Run", day: 28, accountId: "acc-business" },
      { categoryId: "cat-insurance", amount: 912, merchant: "State Farm", day: 5, accountId: "acc-business" },
      { categoryId: "cat-subscriptions", amount: 98, merchant: "Netflix", day: 12, accountId: "acc-credit" },
    ];
    recurring.forEach((r) =>
      push({
        description: r.merchant,
        merchant: r.merchant,
        categoryId: r.categoryId,
        accountId: r.accountId,
        type: "expense",
        amount: r.amount,
        day: r.day,
      })
    );

    // Variable expenses per category
    const variable = [
      { categoryId: "cat-software", count: [6, 10], amount: [90, 420] },
      { categoryId: "cat-utilities", count: [2, 4], amount: [80, 210] },
      { categoryId: "cat-office", count: [0, 3], amount: [25, 280] },
      { categoryId: "cat-meals", count: [8, 15], amount: [14, 96] },
      { categoryId: "cat-transport", count: [4, 9], amount: [18, 74] },
      { categoryId: "cat-health", count: [1, 4], amount: [24, 220] },
      { categoryId: "cat-misc", count: [0, 4], amount: [20, 260] },
    ];

    variable.forEach(({ categoryId, count, amount }) => {
      const n = randInt(count[0], count[1]);
      for (let i = 0; i < n; i++) {
        push({
          description: pick(MERCHANTS[categoryId]),
          merchant: pick(MERCHANTS[categoryId]),
          categoryId,
          accountId: categoryId === "cat-meals" || categoryId === "cat-transport" || categoryId === "cat-health" ? "acc-credit" : "acc-business",
          type: "expense",
          amount: Math.round(rand(amount[0], amount[1]) * 100) / 100,
        });
      }
    });

    // Marketing — skipped some months, heavier in others
    if (chance(0.7)) {
      const n = randInt(1, 3);
      for (let i = 0; i < n; i++) {
        push({
          description: pick(MERCHANTS["cat-marketing"]),
          merchant: pick(MERCHANTS["cat-marketing"]),
          categoryId: "cat-marketing",
          accountId: "acc-business",
          type: "expense",
          amount: Math.round(rand(180, 920) * 100) / 100,
        });
      }
    }

    // Travel — roughly every other month
    if (chance(0.45)) {
      const n = randInt(1, 2);
      for (let i = 0; i < n; i++) {
        push({
          description: pick(MERCHANTS["cat-travel"]),
          merchant: pick(MERCHANTS["cat-travel"]),
          categoryId: "cat-travel",
          accountId: "acc-credit",
          type: "expense",
          amount: Math.round(rand(320, 1900) * 100) / 100,
        });
      }
    }

    // Equipment — every few months
    if (chance(0.22)) {
      push({
        description: pick(MERCHANTS["cat-equipment"]),
        merchant: pick(MERCHANTS["cat-equipment"]),
        categoryId: "cat-equipment",
        accountId: "acc-business",
        type: "expense",
        amount: Math.round(rand(640, 2900) * 100) / 100,
      });
    }
  });

  // Anything from the last five days is still pending
  const fiveDaysAgo = addMonths(endKey, 0);
  const threshold = toISODate(new Date(Date.now() - 5 * 86_400_000));
  return result.map((t) =>
    t.date >= threshold && t.date.slice(0, 7) === fiveDaysAgo ? { ...t, status: "pending" } : t
  );
}

export const transactions = generateTransactions();

/* ------------------------------------------------------------------ */
/* Budgets — limits derived from actual spend so the workspace always   */
/* shows a believable mix of on-track, warning and over-budget items.   */
/* ------------------------------------------------------------------ */

function buildBudgets() {
  const nowKey = currentMonthKey();
  const spend = new Map();
  transactions.forEach((t) => {
    if (t.type !== "expense" || monthKeyOf(t.date) !== nowKey) return;
    spend.set(t.categoryId, (spend.get(t.categoryId) ?? 0) + t.amount);
  });

  // factor > 1 means the limit sits above spend (on track)
  const factors = {
    "cat-software": 0.78,
    "cat-marketing": 0.92,
    "cat-travel": 1.15,
    "cat-meals": 1.2,
    "cat-office": 1.35,
    "cat-misc": 0.85,
    "cat-health": 1.5,
    "cat-transport": 1.4,
    "cat-equipment": 1.25,
  };

  return [...spend.entries()]
    .filter(([, amount]) => amount > 0)
    .map(([categoryId, amount]) => {
      const factor = factors[categoryId] ?? 1.2;
      const limit = Math.max(100, Math.round((amount / factor) / 10) * 10);
      return { categoryId, limit };
    });
}

export const budgets = buildBudgets();

/* ------------------------------------------------------------------ */
/* Bills — recurring monthly obligations                               */
/* ------------------------------------------------------------------ */

export const bills = [
  { id: "bill-rent", name: "Office Rent — WeWork SOMA", amount: 4200, day: 1, categoryId: "cat-rent", accountId: "acc-business" },
  { id: "bill-payroll", name: "Payroll Run", amount: 11800, day: 28, categoryId: "cat-payroll", accountId: "acc-business" },
  { id: "bill-insurance", name: "State Farm — Business Insurance", amount: 912, day: 5, categoryId: "cat-insurance", accountId: "acc-business" },
  { id: "bill-card", name: "Chase Venture Card", amount: 1250, day: 18, categoryId: "cat-misc", accountId: "acc-credit" },
  { id: "bill-software", name: "Vercel Enterprise", amount: 240, day: 9, categoryId: "cat-software", accountId: "acc-business" },
  { id: "bill-comcast", name: "Comcast Business", amount: 149, day: 21, categoryId: "cat-utilities", accountId: "acc-business" },
  { id: "bill-gusto", name: "Gusto Subscription", amount: 99, day: 15, categoryId: "cat-subscriptions", accountId: "acc-business" },
];

/* ------------------------------------------------------------------ */
/* Investments — 252 trading days of random-walk prices                */
/* ------------------------------------------------------------------ */

const holdingsSeed = [
  { id: "h-voo", symbol: "VOO", name: "Vanguard S&P 500 ETF", klass: "US Equities", units: 34, start: 442, drift: 0.11, vol: 0.16, cost: 15800 },
  { id: "h-qqq", symbol: "QQQ", name: "Invesco QQQ Trust", klass: "US Equities", units: 28, start: 412, drift: 0.14, vol: 0.2, cost: 12640 },
  { id: "h-aapl", symbol: "AAPL", name: "Apple Inc.", klass: "Tech", units: 60, start: 189, drift: 0.13, vol: 0.24, cost: 10920 },
  { id: "h-msft", symbol: "MSFT", name: "Microsoft Corp.", klass: "Tech", units: 42, start: 332, drift: 0.15, vol: 0.2, cost: 13940 },
  { id: "h-nvda", symbol: "NVDA", name: "NVIDIA Corp.", klass: "Tech", units: 24, start: 92, drift: 0.42, vol: 0.45, cost: 2280 },
  { id: "h-btc", symbol: "BTC", name: "Bitcoin", klass: "Crypto", units: 0.62, start: 68400, drift: 0.28, vol: 0.55, cost: 28450 },
  { id: "h-bnd", symbol: "BND", name: "Vanguard Total Bond ETF", klass: "Bonds", units: 220, start: 71.2, drift: 0.02, vol: 0.05, cost: 15700 },
  { id: "h-schd", symbol: "SCHD", name: "Schwab Dividend Equity ETF", klass: "Dividends", units: 96, start: 71.8, drift: 0.06, vol: 0.12, cost: 6840 },
];

function tradingDays(count) {
  const days = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (days.length < count) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) days.unshift(toISODate(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }
  return days;
}

function randomWalk(start, annualDrift, annualVol, days) {
  const series = [start];
  for (let i = 1; i < days.length; i++) {
    const dailyReturn = 1 + annualDrift / 252 + (annualVol / Math.sqrt(252)) * gauss();
    series.push(Math.max(0.5, series[i - 1] * dailyReturn));
  }
  return series;
}

const DAYS = tradingDays(252);
const benchmarkWalk = randomWalk(5400, 0.1, 0.15, DAYS);

export const holdings = holdingsSeed.map((h) => {
  const series = randomWalk(h.start, h.drift, h.vol, DAYS);
  return { ...h, series, price: series.at(-1) };
});

export const portfolioSeries = DAYS.map((date, i) => ({
  date,
  value: holdings.reduce((sum, h) => sum + h.units * h.series[i], 0),
  benchmark: benchmarkWalk[i],
}));

/* ------------------------------------------------------------------ */
/* Savings goals                                                       */
/* ------------------------------------------------------------------ */

export const goals = [
  { id: "goal-emergency", name: "Emergency Fund", target: 50000, saved: 31240, deadline: "2026-12-31", color: "#0ea5e9", icon: "umbrella" },
  { id: "goal-trip", name: "Japan Trip", target: 9000, saved: 6850, deadline: "2026-08-15", color: "#f43f5e", icon: "plane" },
  { id: "goal-studio", name: "Studio Setup", target: 6000, saved: 2450, deadline: "2026-04-30", color: "#8b5cf6", icon: "monitor" },
  { id: "goal-home", name: "Home Down Payment", target: 120000, saved: 24300, deadline: "2028-01-31", color: "#10b981", icon: "home" },
];

/* ------------------------------------------------------------------ */
/* Reminders & notifications                                           */
/* ------------------------------------------------------------------ */

const nextMonthKey = addMonths(currentMonthKey(), 1);

export const reminders = [
  { id: "rem-1", title: "Quarterly tax estimate", date: `${nextMonthKey}-15`, amount: 6500 },
  { id: "rem-2", title: "Renew meridian.app domain", date: toISODate(new Date(Date.now() + 9 * 86_400_000)), amount: null },
  { id: "rem-3", title: "Book accountant meeting", date: toISODate(new Date(Date.now() + 6 * 86_400_000)), amount: null },
];

export const notifications = [
  { id: "ntf-1", type: "budget", title: "Software & Tools is over its monthly budget", time: "2h ago", read: false },
  { id: "ntf-2", type: "payment", title: "Invoice #1184 paid — Brightline Media", amount: 12400, time: "5h ago", read: false },
  { id: "ntf-3", type: "bill", title: "Office rent of $4,200.00 is due in 3 days", time: "Yesterday", read: true },
  { id: "ntf-4", type: "system", title: "Your monthly report for February is ready", time: "2d ago", read: true },
];

export const db = {
  accounts,
  categories,
  customers,
  transactions,
  budgets,
  bills,
  holdings,
  goals,
  reminders,
  notifications,
  portfolioSeries,
};
