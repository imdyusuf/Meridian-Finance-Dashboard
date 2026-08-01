import { createElement } from "react";
import {
  Activity,
  ArrowLeftRight,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Target,
  TrendingUp,
  Wallet,
  Settings,
  Banknote,
  Briefcase,
  Car,
  Code2,
  Coins,
  Flag,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Megaphone,
  Monitor,
  MoreHorizontal,
  Plane,
  Receipt,
  Repeat,
  Rocket,
  ShieldCheck,
  Umbrella,
  Users,
  UtensilsCrossed,
  Zap,
} from "lucide-react";

export const APP_NAME = "Meridian";
export const APP_TAGLINE = "Finance operations, beautifully organized.";

/** Sidebar navigation — grouped into sections with i18n label keys. */
export const NAV_SECTIONS = [
  {
    labelKey: "nav.section.overview",
    items: [
      { to: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
      { to: "/analytics", labelKey: "nav.analytics", icon: Activity },
      { to: "/reports", labelKey: "nav.reports", icon: FileText },
    ],
  },
  {
    labelKey: "nav.section.manage",
    items: [
      { to: "/transactions", labelKey: "nav.transactions", icon: ArrowLeftRight },
      { to: "/budgets", labelKey: "nav.budgets", icon: Wallet },
      { to: "/goals", labelKey: "nav.goals", icon: Target },
      { to: "/investments", labelKey: "nav.investments", icon: TrendingUp },
    ],
  },
  {
    labelKey: "nav.section.plan",
    items: [{ to: "/calendar", labelKey: "nav.calendar", icon: CalendarDays }],
  },
];

export const SETTINGS_LINK = { to: "/settings", labelKey: "nav.settings", icon: Settings };

/** Icon lookup for ledger categories (keys live on the mock data). */
export const ICON_MAP = {
  banknote: Banknote,
  briefcase: Briefcase,
  car: Car,
  code: Code2,
  coins: Coins,
  flag: Flag,
  gift: Gift,
  graduation: GraduationCap,
  heart: HeartPulse,
  home: Home,
  land: Landmark,
  megaphone: Megaphone,
  monitor: Monitor,
  dots: MoreHorizontal,
  plane: Plane,
  receipt: Receipt,
  repeat: Repeat,
  rocket: Rocket,
  shield: ShieldCheck,
  umbrella: Umbrella,
  users: Users,
  utensils: UtensilsCrossed,
  wallet: Wallet,
  zap: Zap,
};

export function CategoryIcon({ icon, size = 16, className }) {
  const Icon = ICON_MAP[icon] ?? MoreHorizontal;
  return createElement(Icon, { size, className, "aria-hidden": true });
}

export const CURRENCIES = [
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "JPY", label: "Japanese Yen" },
  { code: "CAD", label: "Canadian Dollar" },
  { code: "AUD", label: "Australian Dollar" },
  { code: "CHF", label: "Swiss Franc" },
  { code: "SGD", label: "Singapore Dollar" },
];

export const GOAL_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6"];

/** Seed data for the notification bell. */
export const NOTIFICATIONS = [
  {
    id: "ntf-1",
    type: "budget",
    title: "Software & Tools is over its monthly budget",
    time: "2h ago",
    read: false,
  },
  {
    id: "ntf-2",
    type: "payment",
    title: "Invoice #1184 paid — Brightline Media",
    amount: 12400,
    time: "5h ago",
    read: false,
  },
  {
    id: "ntf-3",
    type: "bill",
    title: "Office rent of $4,200.00 is due in 3 days",
    time: "Yesterday",
    read: true,
  },
  {
    id: "ntf-4",
    type: "system",
    title: "Your monthly report for February is ready",
    time: "2d ago",
    read: true,
  },
];
