import { create } from "zustand";
import { persist } from "zustand/middleware";
import { translate } from "@/constants/i18n";

const STORAGE_KEY = "meridian.app";

export function resolveSystemTheme() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme) {
  const resolved = theme === "system" ? resolveSystemTheme() : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
  return resolved;
}

function initialTheme() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const state = JSON.parse(raw).state;
      if (state?.theme) return state.theme;
    }
  } catch {
    /* first visit */
  }
  return "system";
}

/** App preferences — persisted to localStorage under `meridian.app`. */
export const useAppStore = create(
  persist(
    (set) => ({
      theme: initialTheme(),
      resolvedTheme: applyTheme(initialTheme()),
      currency: "USD",
      language: "en",
      profile: {
        name: "Alex Rivera",
        email: "alex@meridian.app",
        role: "Founder & CEO",
        company: "Meridian Labs",
      },
      notificationPrefs: {
        bills: true,
        budgetAlerts: true,
        weeklyDigest: false,
        productNews: false,
      },

      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme, resolvedTheme: theme === "system" ? resolveSystemTheme() : theme });
      },
      setCurrency: (currency) => set({ currency }),
      setLanguage: (language) => set({ language }),
      updateProfile: (profile) => set({ profile }),
      toggleNotification: (key) =>
        set((state) => ({
          notificationPrefs: { ...state.notificationPrefs, [key]: !state.notificationPrefs[key] },
        })),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        theme: state.theme,
        currency: state.currency,
        language: state.language,
        profile: state.profile,
        notificationPrefs: state.notificationPrefs,
      }),
    }
  )
);

// Keep the resolved theme in sync when the OS scheme changes while in "system" mode.
window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener("change", () => {
  const state = useAppStore.getState();
  if (state.theme === "system") {
    applyTheme("system");
    useAppStore.setState({ resolvedTheme: resolveSystemTheme() });
  }
});

/** Global toast queue — rendered by <Toaster />. */
export const useToastStore = create((set) => ({
  toasts: [],
  push: (toast) => {
    const id = crypto.randomUUID?.() ?? String(Date.now());
    const entry = { id, type: "success", title: "", ...toast };
    set((state) => ({ toasts: [...state.toasts, entry] }));
    window.setTimeout(() => useToastStore.getState().dismiss(id), 4500);
    return id;
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** Convenience wrapper so callers don't import the store just to toast. */
export function notify(toast) {
  return useToastStore.getState().push(toast);
}

export function useI18nStore() {
  return useAppStore;
}

export { translate };
