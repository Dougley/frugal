/**
 * Localized dayjs instance that syncs with i18next language
 *
 * Usage:
 * ```tsx
 * import { useLocalizedDayjs } from "~/lib/dayjs";
 *
 * function MyComponent() {
 *   const dayjs = useLocalizedDayjs();
 *   return <span>{dayjs(date).fromNow()}</span>;
 * }
 * ```
 */

import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

// Import dayjs locales for each supported language
// Note: "en" is the default and doesn't need to be imported
import "dayjs/locale/nl";

import type { SupportedLanguage } from "./i18n";

// Extend dayjs with plugins once
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

/**
 * Map i18next language codes to dayjs locale codes
 * Most are the same, but some may differ (e.g., "en-pirate" -> "en")
 */
const languageToDayjsLocale: Record<SupportedLanguage, string> = {
  en: "en",
  nl: "nl",
  "en-pirate": "en", // Pirate uses English locale for dates
};

/**
 * Hook that returns a dayjs instance configured for the current i18next language
 *
 * The instance is memoized and updates when the language changes.
 */
export function useLocalizedDayjs() {
  const { i18n } = useTranslation();
  const language = i18n.language as SupportedLanguage;

  return useMemo(() => {
    const locale = languageToDayjsLocale[language] ?? "en";

    // Return a wrapper that applies the locale to each call
    return (date?: dayjs.ConfigType) => dayjs(date).locale(locale);
  }, [language]);
}

/**
 * Get a dayjs instance for a specific language (for SSR)
 */
export function getLocalizedDayjs(language: SupportedLanguage) {
  const locale = languageToDayjsLocale[language] ?? "en";
  return (date?: dayjs.ConfigType) => dayjs(date).locale(locale);
}

// Re-export dayjs for cases where localization isn't needed
export { dayjs };
