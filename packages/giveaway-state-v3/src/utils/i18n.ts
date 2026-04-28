import { createI18n, type I18n, type ICUParams } from "@dougley/frugal-i18n";
import type translations from "../../../../apps/discord/i18n/en-US";

/**
 * Type alias for the app-specific translation type.
 * This enables compile-time validation of translation keys.
 */
export type AppTranslations = typeof translations;

/**
 * Type alias for the typed I18n instance used in giveaway-state.
 */
export type GiveawayI18n = I18n<AppTranslations>;

/**
 * Creates a type-safe i18n instance configured for the giveaway state context.
 *
 * @param kv - KV namespace containing locale translations
 * @returns Configured I18n instance with compile-time key validation
 */
export function createGiveawayI18n(kv: KVNamespace): GiveawayI18n {
  return createI18n<AppTranslations>({
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
  i18n: GiveawayI18n,
  key: Parameters<GiveawayI18n["translate"]>[0],
  locale: string,
  params?: ICUParams
): Promise<string> {
  return i18n.translate(key, { language: locale, params });
}

export type { I18n, ICUParams };
