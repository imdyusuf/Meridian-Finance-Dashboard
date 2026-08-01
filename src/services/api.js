import axios from "axios";
import { db } from "@/data/generator";
import {
  addMonths,
  currentMonthKey,
  daysUntil,
  monthKeyOf,
  shortMonthLabel,
  todayISO,
} from "@/utils/format";

/**
 * API layer.
 *
 * In development the app runs against an in-memory mock adapter that speaks
 * the same REST contract as the future backend. Point VITE_API_BASE_URL at a
 * real server (and drop the mock adapter) to go live — nothing else changes.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const USE_MOCK = import.meta.env.VITE_MOCK_API !== "false";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const latency = () => 160 + Math.random() * 320;

const sum = (items, fn) => items.reduce((total, item) => total + fn(item), 0);

function categoryById(id) {
  return db.categories.find((c) => c.id === id);
}

function accountById(id) {
  return db.accounts.find((a) => a.id === id);
}

function enrichTransaction(t) {
  const category = categoryById(t.categoryId);
  const account = accountById(t.accountId);
  return {
    ...t,
    categoryName: category?.name ?? "Uncategorized",
    categoryColor: category?.color ?? "#94a3b8",
    categoryIcon: category?.icon ?? "dots",
    accountName: account?.name ?? "Unknown",
    accountInstitution: account?.institution ?? "",
  };
}

function monthSeries(months = 12, endKey = currentMonthKey()) {
  const keys = [];
  for (let i = months - 1; i >= 0; i--) keys.push(addMonths(endKey, -i));
  return keys.map((key) => {
    const inMonth = db.transactions.filter((t) => monthKeyOf(t.date) === key);
    const income = sum(inMonth, (t) => (t.type === "income" ? t.amount : 0));
    const expense = sum(inMonth, (t) => (t.type === "expense" ? t.amount : 0));
    return { key, income, expense, net: income - expense };
  });
}

function pctChange(current, previous) {
  if (!previous) return 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function linearForecast(values, steps) {
  const n = values.length;
  if (n < 2) return values.map(() => 0);
  const meanX = (n - 1) / 2;
  const meanY = sum(values, (v) => v) / n;
  const num = values.reduce((acc, y, i) => acc + (i - meanX) * (y - meanY), 0);
  const den = values.reduce((acc, _, i) => acc + (i - meanX) ** 2, 0);
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;
  return Array.from({ length: steps }, (_, i) => intercept + slope * (n + i));
}

function expenseBreakdown(months = 12) {
  const startKey = addMonths(currentMonthKey(), -(months - 1));
  const totals = new Map();
  db.transactions.forEach((t) => {
    if (t.type !== "expense" || t.date < startKey) return;
    totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
  });
  return [...totals.entries()]
    .map(([categoryId, amount]) => ({
      categoryId,
      name: categoryById(categoryId)?.name ?? "Other",
      color: categoryById(categoryId)?.color ?? "#94a3b8",
      icon: categoryById(categoryId)?.icon ?? "dots",
      amount: Math.round(amount * 100) / 100,
    }))
    .sort((a, b) => b.amount - a.amount);
}

function enrichGoal(goal) {
  const pct = goal.target > 0 ? (goal.saved / goal.target) * 100 : 0;
  const days = daysUntil(goal.deadline);
  return {
    ...goal,
    pct,
    daysLeft: days,
    monthsLeft: Math.max(0, Math.round(days / 30)),
    status: pct >= 100 ? "completed" : days < 0 ? "overdue" : days <= 90 ? "due-soon" : "on-track",
  };
}

function reportPeriods() {
  const endKey = currentMonthKey();
  const monthKeys = [];
  for (let i = 13; i >= 0; i--) monthKeys.push(addMonths(endKey, -i));

  const quarterOf = (key) => {
    const [y, m] = key.split("-").map(Number);
    return `${y}-Q${Math.ceil(m / 3)}`;
  };
  const quarterLabel = (q) => {
    const [y, n] = q.split("-Q");
    return `Q${n} ${y}`;
  };

  return {
    monthly: monthKeys.map((key) => ({ value: key, label: shortMonthLabel(key) })),
    quarterly: [...new Set(monthKeys.map(quarterOf))].map((q) => ({ value: q, label: quarterLabel(q) })),
    annual: [...new Set(monthKeys.map((k) => k.slice(0, 4)))].map((y) => ({ value: y, label: y })),
  };
}

function quarterBefore(q) {
  const [y, n] = q.split("-Q").map(Number);
  return n === 1 ? `${y - 1}-Q4` : `${y}-Q${n - 1}`;
}

/* ------------------------------------------------------------------ */
/* Mock handlers — one per REST route                                  */
/* ------------------------------------------------------------------ */

function mockListTransactions({ params }) {
  const { search = "", type = "all", category = "all", account = "all", sortBy = "date", sortDir = "desc", page = 1, pageSize = 8 } = params;
  const query = String(search).trim().toLowerCase();

  let items = db.transactions.map(enrichTransaction);

  if (query) {
    items = items.filter(
      (t) =>
        t.description.toLowerCase().includes(query) ||
        t.merchant.toLowerCase().includes(query) ||
        t.categoryName.toLowerCase().includes(query)
    );
  }
  if (type !== "all") items = items.filter((t) => t.type === type);
  if (category !== "all") items = items.filter((t) => t.categoryId === category);
  if (account !== "all") items = items.filter((t) => t.accountId === account);

  const sorters = {
    date: (a, b) => a.date.localeCompare(b.date),
    amount: (a, b) => a.amount - b.amount,
    description: (a, b) => a.description.localeCompare(b.description),
  };
  const sorter = sorters[sortBy] ?? sorters.date;
  items.sort((a, b) => (sortDir === "asc" ? sorter(a, b) : -sorter(a, b)));

  const total = items.length;
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total, page: Number(page), pageSize: Number(pageSize) };
}

function mockCreateTransaction({ data }) {
  const transaction = {
    id: `txn-${Date.now()}`,
    status: "cleared",
    ...data,
    amount: Number(data.amount),
  };
  db.transactions.unshift(transaction);
  return enrichTransaction(transaction);
}

function mockUpdateTransaction({ data, match }) {
  const id = match[1];
  const index = db.transactions.findIndex((t) => t.id === id);
  if (index === -1) throw new Error("Transaction not found");
  db.transactions[index] = { ...db.transactions[index], ...data, id };
  return enrichTransaction(db.transactions[index]);
}

function mockDeleteTransaction({ match }) {
  const id = match[1];
  db.transactions = db.transactions.filter((t) => t.id !== id);
  return { ok: true };
}

function mockGetBudgets() {
  const nowKey = currentMonthKey();
  const items = db.budgets.map((budget) => {
    const category = categoryById(budget.categoryId);
    const spent = sum(
      db.transactions.filter(
        (t) => t.type === "expense" && monthKeyOf(t.date) === nowKey && t.categoryId === budget.categoryId
      ),
      (t) => t.amount
    );
    const pct = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
    return {
      categoryId: budget.categoryId,
      category: { name: category?.name, color: category?.color, icon: category?.icon },
      limit: budget.limit,
      spent: Math.round(spent * 100) / 100,
      pct,
      remaining: budget.limit - spent,
      status: pct >= 100 ? "over" : pct >= 85 ? "warning" : "on-track",
    };
  });
  items.sort((a, b) => b.spent - a.spent);
  const totalLimit = sum(items, (i) => i.limit);
  const totalSpent = sum(items, (i) => i.spent);
  return {
    month: nowKey,
    totalLimit,
    totalSpent,
    remaining: totalLimit - totalSpent,
    alertCount: items.filter((i) => i.status !== "on-track").length,
    items,
  };
}

function mockSaveBudget({ data }) {
  const existing = db.budgets.find((b) => b.categoryId === data.categoryId);
  if (existing) existing.limit = Number(data.limit);
  else db.budgets.push({ categoryId: data.categoryId, limit: Number(data.limit) });
  return { ok: true };
}

function mockDeleteBudget({ match }) {
  db.budgets = db.budgets.filter((b) => b.categoryId !== match[1]);
  return { ok: true };
}

function mockGetDashboard() {
  const series = monthSeries(12);
  const current = series.at(-1);
  const previous = series.at(-2);

  const cashAccounts = db.accounts.filter((a) => a.type !== "investment");
  const totalBalance = sum(cashAccounts, (a) => a.balance);

  const budgetStatus = mockGetBudgets().items.slice(0, 5);

  const upcomingBills = db.bills
    .map((bill) => {
      let due = `${currentMonthKey()}-${String(bill.day).padStart(2, "0")}`;
      if (daysUntil(due) < -1) due = `${addMonths(currentMonthKey(), 1)}-${String(bill.day).padStart(2, "0")}`;
      return { ...bill, due };
    })
    .filter((bill) => daysUntil(bill.due) >= -1 && daysUntil(bill.due) <= 40)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 5)
    .map((bill) => ({
      ...bill,
      category: categoryById(bill.categoryId)?.name ?? "Other",
      dueDays: daysUntil(bill.due),
    }));

  const recent = [...db.transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6)
    .map(enrichTransaction);

  const last6 = series.slice(-6);
  const avgMonthlyExpense = sum(last6, (m) => m.expense) / last6.length;
  const avgMonthlyNet = sum(last6, (m) => m.net) / last6.length;

  const breakdown = expenseBreakdown(12);
  const topCategory = breakdown[0] ?? null;

  return {
    totalBalance,
    current,
    previous,
    deltas: {
      revenue: pctChange(current.income, previous.income),
      expense: pctChange(current.expense, previous.expense),
      net: pctChange(current.net, previous.net),
      savingsRate: pctChange(
        current.net / Math.max(current.income, 1),
        previous.net / Math.max(previous.income, 1)
      ),
    },
    series: series.map((m) => ({
      label: shortMonthLabel(m.key),
      income: m.income,
      expense: m.expense,
      net: m.net,
    })),
    budgetStatus,
    upcomingBills,
    recent,
    summary: {
      avgMonthlyNet,
      runwayMonths: Math.max(0, totalBalance / Math.max(avgMonthlyExpense, 1)),
      topCategory,
    },
  };
}

function mockGetAnalytics() {
  const series = monthSeries(12);
  const nets = series.map((m) => m.net);
  const forecastValues = linearForecast(nets.slice(-6), 3);

  const forecast = forecastValues.map((value, i) => ({
    label: shortMonthLabel(addMonths(currentMonthKey(), i + 1)),
    net: Math.round(value),
    projected: true,
  }));

  const raw = expenseBreakdown(12);
  const top = raw.slice(0, 6);
  const otherAmount = sum(raw.slice(6), (c) => c.amount);
  const breakdown =
    otherAmount > 0
      ? [...top, { categoryId: "other", name: "Other", color: "#94a3b8", icon: "dots", amount: otherAmount }]
      : top;

  const avgRevenue = sum(series, (m) => m.income) / series.length;
  const avgExpense = sum(series, (m) => m.expense) / series.length;
  const bestMonth = [...series].sort((a, b) => b.net - a.net)[0];

  return {
    series: series.map((m) => ({
      label: shortMonthLabel(m.key),
      income: m.income,
      expense: m.expense,
      net: m.net,
    })),
    forecast,
    breakdown,
    insights: {
      avgRevenue,
      avgExpense,
      savingsRate: avgRevenue > 0 ? (avgRevenue - avgExpense) / avgRevenue : 0,
      bestMonth: bestMonth ? { label: shortMonthLabel(bestMonth.key), net: bestMonth.net } : null,
      topCategory: breakdown[0] ?? null,
    },
  };
}

function mockGetPortfolio() {
  const enriched = db.holdings.map((h) => {
    const value = h.units * h.price;
    const prevPrice = h.series.at(-2) ?? h.price;
    const weekAgo = h.series.at(-8) ?? h.price;
    return {
      ...h,
      value,
      gain: value - h.cost,
      gainPct: h.cost > 0 ? ((value - h.cost) / h.cost) * 100 : 0,
      dayChangePct: prevPrice > 0 ? ((h.price - prevPrice) / prevPrice) * 100 : 0,
      weekChangePct: weekAgo > 0 ? ((h.price - weekAgo) / weekAgo) * 100 : 0,
    };
  });

  const totalValue = sum(enriched, (h) => h.value);
  const totalCost = sum(enriched, (h) => h.cost);
  const dayChange = sum(enriched, (h) => h.units * (h.price - (h.series.at(-2) ?? h.price)));
  const dayChangePct = totalValue - dayChange > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0;

  const classes = new Map();
  enriched.forEach((h) => classes.set(h.klass, (classes.get(h.klass) ?? 0) + h.value));
  const allocation = [...classes.entries()]
    .map(([name, value]) => ({ name, value, pct: totalValue > 0 ? (value / totalValue) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);

  const days = db.portfolioSeries.length;
  const annualized = days > 30 && totalCost > 0 ? ((totalValue / totalCost) ** (252 / days) - 1) * 100 : 0;

  return {
    holdings: enriched.sort((a, b) => b.value - a.value),
    totalValue,
    totalCost,
    totalGain: totalValue - totalCost,
    totalGainPct: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
    dayChange,
    dayChangePct,
    annualized,
    allocation,
    series: db.portfolioSeries.map((p) => ({
      date: p.date,
      value: Math.round(p.value),
      benchmark: Math.round(p.benchmark),
    })),
  };
}

function mockListGoals() {
  return db.goals.map(enrichGoal);
}

function mockCreateGoal({ data }) {
  const goal = { id: `goal-${Date.now()}`, ...data, saved: Number(data.saved ?? 0) };
  db.goals.push(goal);
  return enrichGoal(goal);
}

function mockContributeToGoal({ data, match }) {
  const goal = db.goals.find((g) => g.id === match[1]);
  if (!goal) throw new Error("Goal not found");
  goal.saved = Math.round((goal.saved + Number(data.amount)) * 100) / 100;
  return enrichGoal(goal);
}

function mockDeleteGoal({ match }) {
  db.goals = db.goals.filter((g) => g.id !== match[1]);
  return { ok: true };
}

function mockGetCalendar({ params }) {
  const month = params.month ?? currentMonthKey();
  const events = [];

  db.bills.forEach((bill) => {
    events.push({
      id: `evt-bill-${bill.id}-${month}`,
      date: `${month}-${String(bill.day).padStart(2, "0")}`,
      kind: "bill",
      title: bill.name,
      amount: bill.amount,
      description: categoryById(bill.categoryId)?.name ?? "Bill",
    });
  });

  const incomeByDay = new Map();
  db.transactions.forEach((t) => {
    if (t.type !== "income" || monthKeyOf(t.date) !== month) return;
    const entry = incomeByDay.get(t.date) ?? { amount: 0, count: 0 };
    entry.amount += t.amount;
    entry.count += 1;
    incomeByDay.set(t.date, entry);
  });
  [...incomeByDay.entries()].forEach(([date, entry]) => {
    events.push({
      id: `evt-income-${date}`,
      date,
      kind: "income",
      title: entry.count === 1 ? "Client payment" : `${entry.count} client payments`,
      amount: Math.round(entry.amount * 100) / 100,
      description: "Expected income",
    });
  });

  db.reminders.forEach((reminder) => {
    if (monthKeyOf(reminder.date) !== month) return;
    events.push({
      id: reminder.id,
      date: reminder.date,
      kind: "reminder",
      title: reminder.title,
      amount: reminder.amount,
      description: "Reminder",
    });
  });

  return {
    month,
    events: events.sort((a, b) => a.date.localeCompare(b.date)),
  };
}

function mockListReminders() {
  return db.reminders;
}

function mockCreateReminder({ data }) {
  const reminder = { id: `rem-${Date.now()}`, ...data };
  db.reminders.push(reminder);
  return reminder;
}

function mockDeleteReminder({ match }) {
  db.reminders = db.reminders.filter((r) => r.id !== match[1]);
  return { ok: true };
}

function mockGetReports({ params }) {
  const { periodType = "monthly", period } = params;
  const periods = reportPeriods();
  const available = periods[periodType] ?? periods.monthly;
  const selected = available.find((p) => p.value === period) ?? available.at(-1);

  const inPeriod = (key) => {
    if (periodType === "monthly") return key === selected.value;
    if (periodType === "quarterly") {
      const [y, m] = key.split("-").map(Number);
      return `${y}-Q${Math.ceil(m / 3)}` === selected.value;
    }
    return key.slice(0, 4) === selected.value;
  };
  const inPrevious = (key) => {
    const [y, m] = key.split("-").map(Number);
    if (periodType === "monthly") return key === addMonths(selected.value, -1);
    if (periodType === "quarterly") return `${y}-Q${Math.ceil(m / 3)}` === quarterBefore(selected.value);
    return key.slice(0, 4) === String(Number(selected.value) - 1);
  };

  const aggregate = (predicate) => {
    const rows = db.transactions.filter((t) => predicate(monthKeyOf(t.date)));
    const income = sum(rows, (t) => (t.type === "income" ? t.amount : 0));
    const expense = sum(rows, (t) => (t.type === "expense" ? t.amount : 0));
    return { income, expense, net: income - expense };
  };

  const totals = aggregate(inPeriod);
  const previous = aggregate(inPrevious);

  const categoryTotals = new Map();
  db.transactions.forEach((t) => {
    if (t.type !== "expense" || !inPeriod(monthKeyOf(t.date))) return;
    categoryTotals.set(t.categoryId, (categoryTotals.get(t.categoryId) ?? 0) + t.amount);
  });
  const categoryRows = [...categoryTotals.entries()]
    .map(([categoryId, amount]) => {
      const category = categoryById(categoryId);
      return {
        name: category?.name ?? "Other",
        color: category?.color ?? "#94a3b8",
        amount: Math.round(amount * 100) / 100,
        pct: totals.expense > 0 ? (amount / totals.expense) * 100 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  const pattern = monthSeries(12)
    .filter((m) => inPeriod(m.key))
    .map((m) => ({ label: shortMonthLabel(m.key), income: m.income, expense: m.expense, net: m.net }));

  return {
    periodType,
    periods,
    period: selected,
    totals,
    compare: {
      revenue: pctChange(totals.income, previous.income),
      expense: pctChange(totals.expense, previous.expense),
      net: totals.net - previous.net,
    },
    categoryRows,
    pattern,
  };
}

/* ------------------------------------------------------------------ */
/* Route table + adapter                                               */
/* ------------------------------------------------------------------ */

const routes = [
  { method: "get", pattern: /^\/transactions$/, handler: mockListTransactions },
  { method: "post", pattern: /^\/transactions$/, handler: mockCreateTransaction },
  { method: "put", pattern: /^\/transactions\/([^/]+)$/, handler: mockUpdateTransaction },
  { method: "delete", pattern: /^\/transactions\/([^/]+)$/, handler: mockDeleteTransaction },
  { method: "get", pattern: /^\/budgets$/, handler: mockGetBudgets },
  { method: "post", pattern: /^\/budgets$/, handler: mockSaveBudget },
  { method: "put", pattern: /^\/budgets\/([^/]+)$/, handler: mockSaveBudget },
  { method: "delete", pattern: /^\/budgets\/([^/]+)$/, handler: mockDeleteBudget },
  { method: "get", pattern: /^\/dashboard$/, handler: mockGetDashboard },
  { method: "get", pattern: /^\/analytics$/, handler: mockGetAnalytics },
  { method: "get", pattern: /^\/portfolio$/, handler: mockGetPortfolio },
  { method: "get", pattern: /^\/goals$/, handler: mockListGoals },
  { method: "post", pattern: /^\/goals$/, handler: mockCreateGoal },
  { method: "post", pattern: /^\/goals\/([^/]+)\/contribute$/, handler: mockContributeToGoal },
  { method: "delete", pattern: /^\/goals\/([^/]+)$/, handler: mockDeleteGoal },
  { method: "get", pattern: /^\/calendar$/, handler: mockGetCalendar },
  { method: "get", pattern: /^\/reminders$/, handler: mockListReminders },
  { method: "post", pattern: /^\/reminders$/, handler: mockCreateReminder },
  { method: "delete", pattern: /^\/reminders\/([^/]+)$/, handler: mockDeleteReminder },
  { method: "get", pattern: /^\/reports$/, handler: mockGetReports },
];

function respond(status, data, config) {
  return {
    data,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: { "content-type": "application/json" },
    config,
  };
}

async function mockAdapter(config) {
  const method = (config.method ?? "get").toLowerCase();
  const url = (config.url ?? "").split("?")[0];
  await sleep(latency());

  const route = routes.find((r) => r.method === method && r.pattern.test(url));
  if (!route) {
    return respond(404, { message: `No mock route for ${method.toUpperCase()} ${url}` }, config);
  }

  try {
    const params = config.params ?? {};
    const data = config.data ? JSON.parse(config.data) : undefined;
    const match = url.match(route.pattern);
    const result = await route.handler({ params, data, match, url });
    return respond(200, result, config);
  } catch (error) {
    return respond(400, { message: error.message ?? "Mock API error" }, config);
  }
}

export const api = axios.create({
  baseURL: BASE_URL,
  adapter: USE_MOCK ? mockAdapter : undefined,
  timeout: 10_000,
});

/* ------------------------------------------------------------------ */
/* Typed resource functions consumed by the feature hooks              */
/* ------------------------------------------------------------------ */

export const getTransactions = (params) => api.get("/transactions", { params }).then((r) => r.data);
export const createTransaction = (payload) => api.post("/transactions", payload).then((r) => r.data);
export const updateTransaction = ({ id, ...payload }) => api.put(`/transactions/${id}`, payload).then((r) => r.data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`).then((r) => r.data);

export const getBudgets = () => api.get("/budgets").then((r) => r.data);
export const saveBudget = (payload) => api.post("/budgets", payload).then((r) => r.data);
export const deleteBudget = (categoryId) => api.delete(`/budgets/${categoryId}`).then((r) => r.data);

export const getDashboard = () => api.get("/dashboard").then((r) => r.data);
export const getAnalytics = () => api.get("/analytics").then((r) => r.data);
export const getPortfolio = () => api.get("/portfolio").then((r) => r.data);

export const getGoals = () => api.get("/goals").then((r) => r.data);
export const createGoal = (payload) => api.post("/goals", payload).then((r) => r.data);
export const contributeToGoal = (id, amount) => api.post(`/goals/${id}/contribute`, { amount }).then((r) => r.data);
export const deleteGoal = (id) => api.delete(`/goals/${id}`).then((r) => r.data);

export const getCalendar = (month) => api.get("/calendar", { params: { month } }).then((r) => r.data);
export const getReminders = () => api.get("/reminders").then((r) => r.data);
export const createReminder = (payload) => api.post("/reminders", payload).then((r) => r.data);
export const deleteReminder = (id) => api.delete(`/reminders/${id}`).then((r) => r.data);

export const getReports = (params) => api.get("/reports", { params }).then((r) => r.data);
