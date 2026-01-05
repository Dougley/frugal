import { createI18n, type I18n, type ICUParams } from "@dougley/frugal-i18n";

/**
 * Creates an i18n instance configured for the giveaway state context.
 *
 * @param kv - KV namespace containing locale translations
 * @returns Configured I18n instance
 */
export function createGiveawayI18n(kv: KVNamespace): I18n {
  return createI18n({
    kv,
    defaultLanguage: "en-US",
    cacheSize: 50,
    cacheTtl: 300,
    fallbackToDefault: true,
  });
}

/**
 * Helper to translate a giveaway-related message.
 *
 * @param i18n - I18n instance
 * @param key - Translation key (e.g., "giveaway.ended.no_winners")
 * @param locale - Locale to translate to
 * @param params - Optional ICU parameters
 * @returns Translated string
 */
export async function translateGiveaway(
  i18n: I18n,
  key: string,
  locale: string,
  params?: ICUParams
): Promise<string> {
  return i18n.translate(key, { language: locale, params });
}

export type { I18n, ICUParams };
