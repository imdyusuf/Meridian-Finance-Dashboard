import { NavLink } from "react-router-dom";
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";
import { APP_NAME, NAV_SECTIONS, SETTINGS_LINK } from "@/constants";
import { useI18n } from "@/hooks/useI18n";
import { useAppStore, notify } from "@/store/appStore";
import { cn } from "@/utils/cn";
import logo from "@/assets/logo.svg";

export function Sidebar({ collapsed, onToggleCollapse }) {
  const { t } = useI18n();
  const profile = useAppStore((state) => state.profile);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-surface transition-[width] duration-200 print:hidden lg:flex",
        collapsed ? "w-[76px]" : "w-64"
      )}
    >
      <div className={cn("flex h-16 items-center border-b border-line", collapsed ? "justify-center px-0" : "gap-2.5 px-5")}>
        <img src={logo} alt="" className="h-8 w-8 shrink-0" />
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="text-[15px] font-bold tracking-tight text-ink">{APP_NAME}</p>
            <p className="text-[11px] font-medium text-faint">Finance</p>
          </div>
        )}
      </div>

      <NavContent collapsed={collapsed} />

      <div className="border-t border-line p-3">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-elevated hover:text-ink",
            collapsed && "justify-center px-0"
          )}
        >
          {collapsed ? <ChevronsRight size={17} /> : <ChevronsLeft size={17} />}
          {!collapsed && <span>Collapse</span>}
        </button>
        <div className={cn("mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5", collapsed && "justify-center px-0")}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-violet-500 text-[11px] font-bold text-white">
            {profile.name
              .split(" ")
              .map((word) => word[0])
              .join("")
              .slice(0, 2)}
          </span>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[13px] font-semibold text-ink">{profile.name}</p>
              <p className="truncate text-[11px] text-faint">{profile.role}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

/** Navigation list — shared between the desktop sidebar and mobile drawer. */
export function NavContent({ collapsed = false, onNavigate }) {
  const { t } = useI18n();
  const linkClass = ({ isActive }) =>
    cn(
      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
      collapsed && "justify-center px-0",
      isActive ? "bg-brand-soft text-brand" : "text-muted hover:bg-elevated hover:text-ink"
    );

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
      {NAV_SECTIONS.map((section) => (
        <div key={section.labelKey} className="mb-5">
          {!collapsed && (
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-faint">
              {t(section.labelKey)}
            </p>
          )}
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onNavigate}
                  title={collapsed ? t(item.labelKey) : undefined}
                  className={linkClass}
                >
                  <item.icon size={18} aria-hidden="true" className="shrink-0" />
                  {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
                  {!collapsed && (
                    <span
                      className={cn(
                        "absolute right-2.5 h-1.5 w-1.5 rounded-full bg-brand opacity-0 transition-opacity",
                        "group-[[aria-current=page]]:opacity-100"
                      )}
                      aria-hidden="true"
                    />
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="mb-1.5 mt-auto">
        <NavLink to={SETTINGS_LINK.to} onClick={onNavigate} className={linkClass}>
          <SETTINGS_LINK.icon size={18} aria-hidden="true" className="shrink-0" />
          {!collapsed && <span>{t(SETTINGS_LINK.labelKey)}</span>}
        </NavLink>
      </div>

      {!collapsed && (
        <button
          type="button"
          onClick={() => notify({ type: "success", title: "Signed out", message: "You've been signed out of Meridian." })}
          className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-muted transition-colors hover:bg-elevated hover:text-ink"
        >
          <LogOut size={18} aria-hidden="true" className="shrink-0" />
          <span>Sign out</span>
        </button>
      )}
    </nav>
  );
}
