import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

// Import translation resources directly for bundling
import en from "~/locales/en.json";
import enPirate from "~/locales/en-pirate.json";
import nl from "~/locales/nl.json";

// Supported languages - add more as needed
export const supportedLanguages = ["en", "nl", "en-pirate"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const defaultLanguage: SupportedLanguage = "en";

/**
 * Language metadata for the language switcher
 * - nativeName: Language name in its own language (for display)
 * - englishName: Language name in English (for search)
 */
export interface LanguageInfo {
  nativeName: string;
  englishName: string;
}

export const languageInfo: Record<SupportedLanguage, LanguageInfo> = {
  en: {
    nativeName: "English",
    englishName: "English",
  },
  nl: {
    nativeName: "Nederlands",
    englishName: "Dutch",
  },
  "en-pirate": {
    nativeName: "YARRR!!!",
    englishName: "Nautical English",
  },
};

// Legacy export for backwards compatibility
export const languageNames: Record<SupportedLanguage, string> =
  Object.fromEntries(
    Object.entries(languageInfo).map(([code, info]) => [code, info.nativeName])
  ) as Record<SupportedLanguage, string>;

// Bundled resources for SSR - no async loading needed
export const resources = {
  en: { translation: en },
  nl: { translation: nl },
  "en-pirate": { translation: enPirate },
} as const;

/**
 * Shared i18n configuration options
 */
const sharedConfig = {
  resources,
  fallbackLng: defaultLanguage,
  supportedLngs: [...supportedLanguages],

  interpolation: {
    escapeValue: false, // React already escapes values
  },

  // Synchronous initialization - resources are bundled, no async loading needed
  // This ensures translations are available immediately for SSR (important for crawlers)
  initImmediate: false,

  // Disable suspense for SSR compatibility
  react: {
    useSuspense: false,
  },
} as const;

/**
 * Create a configured i18n instance for server-side rendering
 *
 * Uses synchronous initialization to ensure translations are available
 * immediately for SSR (important for crawlers/SEO).
 */
export function createServerI18nInstance(language: SupportedLanguage) {
  const instance = i18n.createInstance();

  instance.use(initReactI18next).init({
    ...sharedConfig,
    lng: language,
  });

  return instance;
}

/**
 * Create a configured i18n instance for client-side
 *
 * Uses i18next-browser-languagedetector for automatic detection and caching.
 * Falls back to SSR-detected language for initial hydration.
 *
 * Detection order:
 * 1. Cookie (persisted user preference, synced with SSR)
 * 2. localStorage (client-side fallback)
 * 3. navigator (browser language)
 */
export function createClientI18nInstance(_ssrLanguage: SupportedLanguage) {
  const instance = i18n.createInstance();

  instance
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      ...sharedConfig,
      // No explicit `lng` — letting the detector run its full lifecycle so
      // cacheUserLanguage is wired to languageChanged and cookie writes work.
      // On first load the detector falls back to navigator (matches SSR).
      // On subsequent loads it reads the cookie set by changeLanguage.

      detection: {
        // Detection order - cookie first for consistency with SSR
        order: ["cookie", "localStorage", "navigator"],

        // Cache preference in both cookie (for SSR) and localStorage
        caches: ["cookie", "localStorage"],

        // Cookie settings matching our server-side detection
        cookieMinutes: 60 * 24 * 365, // 1 year
        lookupCookie: "lang",
        lookupLocalStorage: "i18nextLng",

        // Convert browser locales to our supported format (e.g., "en-US" -> "en")
        convertDetectedLanguage: (lng: string) => lng.split("-")[0],
      },
    });

  return instance;
}

/**
 * Detect language from Accept-Language header
 */
export function detectLanguageFromHeaders(
  acceptLanguage: string | null
): SupportedLanguage {
  if (!acceptLanguage) return defaultLanguage;

  // Parse Accept-Language header (e.g., "en-US,en;q=0.9,nl;q=0.8")
  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const [code, q] = lang.trim().split(";q=");
      return {
        code: code.split("-")[0].toLowerCase(), // "en-US" -> "en"
        quality: q ? Number.parseFloat(q) : 1,
      };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find first supported language
  for (const { code } of languages) {
    if (supportedLanguages.includes(code as SupportedLanguage)) {
      return code as SupportedLanguage;
    }
  }

  return defaultLanguage;
}

// Type augmentation for useTranslation hook
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: typeof en;
    };
  }
}
