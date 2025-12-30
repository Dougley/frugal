import { createServerFn } from "@tanstack/react-start";
import { getCookie, getRequestHeader } from "@tanstack/react-start/server";
import {
  defaultLanguage,
  detectLanguageFromHeaders,
  type SupportedLanguage,
  supportedLanguages,
} from "~/lib/i18n";

/**
 * Server function to get the detected language from request headers
 *
 * Language detection priority:
 * 1. Cookie (user preference from language switcher)
 * 2. Accept-Language header (browser preference)
 * 3. Default fallback (English)
 */
export const getLanguageFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<SupportedLanguage> => {
    // Use TanStack Start's getCookie helper for reliable cookie access
    const langCookie = getCookie("lang");
    const acceptLanguageHeader = getRequestHeader("accept-language");

    // Validate cookie value is a supported language
    const fromCookie =
      langCookie && supportedLanguages.includes(langCookie as SupportedLanguage)
        ? (langCookie as SupportedLanguage)
        : null;

    const fromHeaders = detectLanguageFromHeaders(acceptLanguageHeader ?? null);

    return fromCookie ?? fromHeaders ?? defaultLanguage;
  }
);
