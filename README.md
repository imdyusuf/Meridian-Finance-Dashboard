# Meridian — Finance Dashboard

Meridian is a finance operations dashboard for tracking revenue, expenses, budgets,
investments and savings goals in one place. Built with React 19, Vite, TanStack
Query, Zustand, React Hook Form + Zod, Recharts, Framer Motion and Tailwind CSS.

---

## Quick start

```bash
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173`).

Production build:

```bash
npm run build   # outputs a self-contained dist/index.html
npm run preview # serve the production build
```

No extra configuration is required to run it locally.

---

## Features

| Module | Highlights |
| --- | --- |
| **Dashboard** | KPI cards with sparklines & deltas, 12-month cash-flow chart, budget status, recent transactions, upcoming bills, cash runway |
| **Transactions** | Full CRUD, debounced search, type/category filters, column sorting, pagination, category tags, status badges, CSV export |
| **Budgets** | Monthly limits per category, spending progress, on-track / warning / over-budget states, overspend alerts |
| **Analytics** | Income vs expenses, category breakdown donut, net cash-flow area chart with a 3-month linear forecast, insight KPIs |
| **Investments** | Portfolio value, total gain, daily change, annualized return, allocation donut, performance vs S&P 500, holdings table |
| **Savings Goals** | Progress rings, completion %, deadlines, countdowns, contributions |
| **Reports** | Monthly / quarterly / annual reports with compare chips, category tables, monthly pattern charts and a PDF export flow (print) |
| **Calendar** | Bills, expected income days and reminders on a month grid with a day-detail panel |
| **Settings** | Profile, theme (light/dark/system), currency (8 options), language (en/es), notification preferences, security (password, 2FA, sessions) |

Cross-cutting: toast notifications, skeleton loading, empty & error states,
responsive layout (mobile drawer nav), keyboard navigation, WCAG-oriented
semantics, and `prefers-reduced-motion` support.

---

## Architecture

Feature-based structure — each module owns its UI, forms and query hooks, while
shared primitives live in `components/`.

```
src/
├── app/                 # ErrorBoundary (app root)
├── assets/              # logo.svg
├── components/
│   ├── charts/          # ChartCard, shared tooltip, palette hook
│   ├── common/          # States (Skeleton/Empty/Error), PageHeader, StatCard
│   ├── layout/          # Sidebar, Topbar
│   └── ui/              # Button, Field, Card, Badge, Modal, Tabs, Table, Dropdown, Toaster
├── constants/           # nav config, i18n dictionary, theme, chart palettes
├── data/                # seed ledger (deterministic PRNG)
├── features/
│   ├── dashboard/       # DashboardPage
│   ├── transactions/    # page + form + query hooks (CRUD, CSV)
│   ├── budgets/         # page + form
│   ├── analytics/       # page + charts
│   ├── investments/     # page + charts
│   ├── goals/           # page + forms
│   ├── reports/         # page
│   ├── calendar/        # page + reminder form
│   └── settings/        # page (profile/preferences/notifications/security)
├── hooks/               # useDebounce, useI18n
├── layouts/             # AppLayout (shell: sidebar + topbar + outlet)
├── pages/               # NotFoundPage
├── routes/              # lazy route table
├── services/            # axios instance + local API layer
├── store/               # Zustand stores (preferences, toasts)
├── styles/              # design tokens + Tailwind entry
└── utils/               # cn, format (Intl), csv
```

### Data flow

- **UI components** call **feature hooks** (`useTransactionsQuery`, …) which wrap
  TanStack Query.
- Query functions hit the **services layer** — an axios instance with a local
  adapter that routes REST-style calls (`GET /transactions`, `POST /goals/:id/contribute`, …)
  against an in-memory store seeded by `data/generator.js`.
- Mutations invalidate every derived collection (ledger → dashboard, budgets,
  analytics, reports, calendar) so views stay consistent after a write.

### Connecting a real backend

The local adapter implements the same contract a backend would expose. Set:

```bash
VITE_API_BASE_URL=https://api.yourdomain.com/v1
VITE_MOCK_API=false
```

and restart. The adapter swaps out, the rest of the app is unaffected.

---

## Engineering notes

- **Data** — a seeded PRNG (mulberry32) generates 14 months of transactions
  (~500 rows), budgets derived from actual spend (so warning/over states
  always occur), 252 trading days of random-walk prices for 8 holdings, bills,
  goals and reminders. Reloads stay stable.
- **State** — Zustand persists preferences (theme, currency, language, profile,
  notification prefs) to `localStorage`; toasts live in a separate store.
- **Theming** — colors flow through CSS variables; Tailwind v4 maps them via
  `@theme inline`. Charts re-resolve their palette when the theme flips.
- **Forms** — React Hook Form + Zod everywhere; category lists react to type
  changes, cross-field validation (password match, amount ranges).
- **Performance** — lazy-loaded routes, memoized Intl formatters, debounced
  search, server-side style filtering/pagination in the API layer.
- **Accessibility** — semantic landmarks, `aria-sort`/`aria-pressed`/`role=menu`
  semantics, Escape-to-close overlays with scroll lock, focus-visible rings,
  `aria-live` toasts, reduced-motion CSS.

---

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build (single-file output) |
| `npm run preview` | Preview the production build |
