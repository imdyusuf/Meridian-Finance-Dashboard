import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CheckCheck,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
} from "lucide-react";
import { NAV_SECTIONS, NOTIFICATIONS, SETTINGS_LINK } from "@/constants";
import { useAppStore, notify } from "@/store/appStore";
import { useI18n } from "@/hooks/useI18n";
import { Dropdown } from "@/components/ui/Dropdown";
import { IconButton } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

function usePageTitle() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  return useMemo(() => {
    for (const section of NAV_SECTIONS) {
      const match = section.items.find((item) => pathname.startsWith(item.to));
      if (match) return t(match.labelKey);
    }
    if (pathname.startsWith(SETTINGS_LINK.to)) return t(SETTINGS_LINK.labelKey);
    return t("nav.dashboard");
  }, [pathname, t]);
}

export function Topbar({ onOpenMobileNav }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const title = usePageTitle();

  const theme = useAppStore((state) => state.theme);
  const resolvedTheme = useAppStore((state) => state.resolvedTheme);
  const setTheme = useAppStore((state) => state.setTheme);
  const profile = useAppStore((state) => state.profile);

  const [query, setQuery] = useState("");
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const submitSearch = (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/transactions?q=${encodeURIComponent(trimmed)}`);
    setQuery("");
  };

  const initials = profile.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-elevated hover:text-ink lg:hidden"
        >
          <Menu size={19} aria-hidden="true" />
        </button>

        <h2 className="min-w-0 truncate text-[15px] font-semibold text-ink">{title}</h2>

        <div className="ml-auto flex items-center gap-1.5">
          <form onSubmit={submitSearch} role="search" className="relative hidden md:block">
            <Search
              size={15}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`${t("common.search")} transactions…`}
              aria-label={t("common.search")}
              className="h-9 w-52 rounded-xl border border-line bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-faint transition-all duration-200 focus:w-64 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 lg:w-64"
            />
          </form>

          <IconButton
            label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            icon={resolvedTheme === "dark" ? Sun : Moon}
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="relative"
          />

          <Dropdown
            align="end"
            menuClassName="w-80"
            trigger={
              <button
                type="button"
                aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-elevated hover:text-ink"
              >
                <Bell size={18} aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />
                )}
              </button>
            }
            items={[
              ...notifications.map((item) => ({
                label: item.title,
                onClick: () =>
                  setNotifications((prev) =>
                    prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
                  ),
              })),
              { separator: true },
              {
                label: "Mark all as read",
                icon: CheckCheck,
                onClick: () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))),
              },
            ]}
          />

          <div className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden="true" />

          <Dropdown
            align="end"
            trigger={
              <button
                type="button"
                aria-label="Account menu"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-violet-500 text-[11px] font-bold text-white ring-2 ring-transparent transition-shadow hover:ring-brand/30"
              >
                {initials}
              </button>
            }
            items={[
              {
                label: `${profile.name} · ${profile.email}`,
                disabled: true,
              },
              { separator: true },
              {
                label: t("common.profile"),
                icon: Settings,
                onClick: () => navigate(SETTINGS_LINK.to),
              },
              {
                label: "Sign out",
                icon: LogOut,
                tone: "danger",
                onClick: () =>
                  notify({
                    type: "success",
                    title: "Signed out",
                    message: "You've been signed out of Meridian.",
                  }),
              },
            ]}
          />
        </div>
      </div>
    </header>
  );
}
