import { Suspense, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar, NavContent } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Drawer } from "@/components/ui/Modal";
import { PageLoader } from "@/components/common/States";
import { APP_NAME } from "@/constants";
import { cn } from "@/utils/cn";
import logo from "@/assets/logo.svg";

/**
 * Application shell: fixed sidebar (desktop), sticky topbar, lazy-loaded
 * route outlet with a subtle cross-fade between pages, and a drawer-based
 * navigation for small screens.
 */
export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((value) => !value)} />

      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-200",
          collapsed ? "lg:pl-[76px]" : "lg:pl-64"
        )}
      >
        <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />

        <main id="main-content" className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="border-t border-line px-6 py-5 print:hidden">
          <p className="text-xs text-faint">
            © {new Date().getFullYear()} {APP_NAME} Labs · All rights reserved.
          </p>
        </footer>
      </div>

      <Drawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} width="w-72">
        <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
          <img src={logo} alt="" className="h-8 w-8" />
          <p className="text-[15px] font-bold tracking-tight text-ink">{APP_NAME}</p>
        </div>
        <NavContent onNavigate={() => setMobileNavOpen(false)} />
      </Drawer>
    </div>
  );
}
