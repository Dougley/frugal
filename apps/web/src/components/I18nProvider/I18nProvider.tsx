import { useRouter } from "@tanstack/react-router";
import type { i18n } from "i18next";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";
import { I18nextProvider } from "react-i18next";
import {
  createClientI18nInstance,
  createServerI18nInstance,
  defaultLanguage,
  type SupportedLanguage,
} from "~/lib/i18n";

interface I18nContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * Hook to access i18n context for language switching
 */
export function useI18nContext() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18nContext must be used within an I18nProvider");
  }
  return context;
}

interface I18nProviderProps {
  children: ReactNode;
  language: SupportedLanguage;
}

/**
 * I18n provider that wraps the app with i18next context
 *
 * Server-side: Uses createServerI18nInstance with detected language
 * Client-side: Uses createClientI18nInstance with browser language detector
 *
 * The browser language detector:
 * 1. Cookie (persisted user preference, synced with SSR)
 * 2. localStorage (client-side fallback)
 * 3. navigator (browser language)
 */
export function I18nProvider({ children, language }: I18nProviderProps) {
  const isServer = typeof window === "undefined";
  const router = useRouter();

  const clientI18nRef = useRef<i18n | null>(null);

  // Create appropriate i18n instance based on environment
  const i18n = useMemo(() => {
    // Server-side: always create a new instance with the detected language
    if (isServer) {
      return createServerI18nInstance(language);
    }

    // Client-side: reuse the existing instance or create a new one
    if (!clientI18nRef.current) {
      clientI18nRef.current = createClientI18nInstance(language);
    }
    return clientI18nRef.current;
    // Note: isServer is a constant (typeof window === "undefined"), so it's not a real dependency
    // We only need to react to language changes on the server side
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Handle language changes (client-side only)
  // Wrapped in useCallback for stable reference in contextValue
  const setLanguage = useCallback(
    async (newLang: SupportedLanguage) => {
      await i18n.changeLanguage(newLang);
      await router.invalidate();
    },
    [i18n, router]
  );

  const contextValue = useMemo(
    () => ({
      language: (i18n.language as SupportedLanguage) ?? defaultLanguage,
      setLanguage,
    }),
    [i18n.language, setLanguage]
  );

  return (
    <I18nContext.Provider value={contextValue}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </I18nContext.Provider>
  );
}

/**
 * Re-export useTranslation for convenience
 */
export { useTranslation } from "react-i18next";
