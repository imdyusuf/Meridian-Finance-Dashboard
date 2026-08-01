import { useMemo } from "react";
import { useAppStore } from "@/store/appStore";
import { LANGUAGES, translate } from "@/constants/i18n";

/**
 * Binds the current language + currency to the app store and exposes a
 * `t()` function for dictionary lookups.
 */
export function useI18n() {
  const language = useAppStore((state) => state.language);
  const currency = useAppStore((state) => state.currency);

  return useMemo(() => {
    const meta = LANGUAGES.find((lang) => lang.code === language) ?? LANGUAGES[0];
    return {
      t: (key, vars) => translate(language, key, vars),
      locale: meta.locale,
      language,
      currency,
    };
  }, [language, currency]);
}
