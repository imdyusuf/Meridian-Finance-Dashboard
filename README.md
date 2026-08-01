# Meridian Finance Dashboard

Meridian Finance Dashboard is a web application for managing personal finance in one place. It helps users to keep track of income, expenses, budgets, investments, savings goals, reports, and financial events. The project is built using React and Vite with a feature-based folder structure and reusable UI components.

The main goal of this project is to provide a clean and organized finance dashboard that is easy to use and easy to maintain.

---

## Features

### Dashboard

The dashboard provides a quick overview of financial information.

It includes:

* Financial summary cards
* Cash flow chart
* Budget overview
* Recent transactions
* Upcoming bills
* Cash runway information

---

### Transactions

The transaction module is used to manage daily financial records.

Features:

* Add transaction
* Edit transaction
* Delete transaction
* Search transactions
* Filter by category and type
* Sort transaction table
* Pagination
* CSV export
* Status and category badges

---

### Budgets

The budget section helps users monitor spending and compare it with planned budgets.

Features:

* Budget by category
* Spending progress
* Remaining budget
* Overspending indicators

---

### Analytics

The analytics section provides visual insights into financial data.

It includes:

* Income vs Expense charts
* Category breakdown
* Cash flow trend
* Forecast chart
* Financial summary

---

### Investments

The investment section provides portfolio information.

Features:

* Portfolio value
* Total gain
* Daily performance
* Annual return
* Asset allocation
* Holdings table
* Performance comparison

---

### Savings Goals

The savings goals section helps users monitor their financial goals.

Features:

* Goal progress
* Completion percentage
* Remaining amount
* Contribution tracking

---

### Reports

The reports section provides financial summaries.

Available reports include:

* Monthly reports
* Quarterly reports
* Annual reports
* Category summaries
* Comparison reports
* Print-friendly PDF export

---

### Calendar

The calendar module helps users manage financial events.

It displays:

* Bills
* Income reminders
* Payment reminders
* Scheduled financial events

---

### Settings

The settings page allows users to customize the application.

Available options:

* Profile settings
* Theme selection
* Currency selection
* Language settings
* Notification settings
* Security settings

---

## Tech Stack

* React 19
* Vite
* React Router
* Zustand
* TanStack Query
* React Hook Form
* Zod
* Axios
* Recharts
* Framer Motion
* Tailwind CSS

---

## Project Structure

```text
src/
├── app/
├── assets/
├── components/
│   ├── charts/
│   ├── common/
│   ├── layout/
│   └── ui/
├── constants/
├── data/
├── features/
│   ├── analytics/
│   ├── budgets/
│   ├── calendar/
│   ├── dashboard/
│   ├── goals/
│   ├── investments/
│   ├── reports/
│   ├── settings/
│   └── transactions/
├── hooks/
├── layouts/
├── pages/
├── routes/
├── services/
├── store/
├── styles/
└── utils/
```

The project follows a feature-based architecture. Each major feature is separated into its own folder while shared components, utilities, layouts, hooks, and state management are placed in common folders. This structure keeps the project organized and easier to maintain.

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

* Node.js
* npm

### Installation

Clone the repository.

```bash
git clone <repository-url>
```

Move into the project folder.

```bash
cd Meridian-Finance-Dashboard
```

Install dependencies.

```bash
npm install
```

Start the development server.

```bash
npm run dev
```

Open the local development URL shown in the terminal.

---

## Available Scripts

| Command           | Description                      |
| ----------------- | -------------------------------- |
| `npm run dev`     | Start development server         |
| `npm run build`   | Build the project for production |
| `npm run preview` | Preview the production build     |
| `npm run lint`    | Run ESLint                       |

---

## Application Routes

The application contains the following main sections:

* Dashboard
* Transactions
* Budgets
* Analytics
* Investments
* Goals
* Reports
* Calendar
* Settings

Unknown routes are handled by a dedicated **Not Found** page.

---

## Main Libraries

| Library         | Purpose                   |
| --------------- | ------------------------- |
| React Router    | Client-side routing       |
| Zustand         | Global state management   |
| TanStack Query  | Data fetching and caching |
| Axios           | HTTP requests             |
| React Hook Form | Form management           |
| Zod             | Form validation           |
| Recharts        | Data visualization        |
| Framer Motion   | Animations                |

---

## UI Components

The project contains reusable UI components that are shared across different modules.

Some commonly used components include:

* Buttons
* Cards
* Tables
* Forms
* Dropdowns
* Tabs
* Modals
* Toast notifications
* Badges

Using reusable components helps keep the UI consistent throughout the application.

---

## License

This project is licensed under the **MIT License**.

You are free to use, modify, distribute, and publish this project according to the terms of the MIT License.
