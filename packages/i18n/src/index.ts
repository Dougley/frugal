import { IntlMessageFormat } from "intl-messageformat";
import type { TranslationKeys } from "./types";

// Re-export type utilities
export type {
  ExtractICUParams,
  ICUParamsFor,
  IsEmptyParams,
  PathValue,
  TranslationKeys,
  TypedTranslateOptions,
  TypedTranslateOptionsNoParams,
  TypedTranslateOptionsWithParams,
} from "./types";

/**
 * Configuration options for the I18n instance.
 */
export interface I18nConfig {
  /** Cloudflare KV namespace for storing translations */
  kv: KVNamespace;
  /** Default language code (e.g., 'en', 'es', 'fr'). Defaults to 'en' */
  defaultLanguage?: string;
  /** Maximum number of translation sets to cache in memory. Defaults to 50 */
  cacheSize?: number;
  /** Cache TTL in seconds. Defaults to 300 (5 minutes) */
  cacheTtl?: number;
  /** Whether to fallback to default language when translation is missing. Defaults to true */
  fallbackToDefault?: boolean;
}

/**
 * Parameters for ICU message formatting.
 */
export interface ICUParams {
  [key: string]: string | number | boolean | Date;
}

/**
 * Options for the translate method.
 */
export interface TranslateOptions {
  /** Parameters for ICU message formatting */
  params?: ICUParams;
  /** Language code. If not provided, uses the default language */
  language?: string;
}

/**
 * Represents a nested translation object with string values at leaf nodes.
 */
export interface Translation {
  [key: string]: string | Translation;
}

/**
 * Internal cache entry structure with TTL tracking.
 * @internal
 */
export interface CacheEntry {
  data: Translation;
  timestamp: number;
  ttl: number;
}

type I18nKey<T extends Translation> = string extends keyof T
  ? string
  : TranslationKeys<T>;

/**
 * Type-safe I18n class providing internationalization features for Cloudflare Workers.
 *
 * Features:
 * - Compile-time validation of translation keys
 * - KV-backed persistent storage
 * - LRU cache with TTL for performance
 * - Dot notation path support
 * - ICU MessageFormat support
 *
 * @template T - The translation object type for compile-time key validation
 *
 * @example
 * ```typescript
 * import type translations from './i18n/en-US';
 * import { createI18n } from '@dougley/frugal-i18n';
 *
 * const i18n = createI18n<typeof translations>({
 *   kv: env.KV,
 *   defaultLanguage: 'en-US',
 * });
 *
 * // Type-safe - compiler validates key exists
 * const message = await i18n.translate('commands.ping.messages.success', {
 *   params: { rtt: 42 },
 *   language: 'en-US'
 * });
 *
 * // Compile error: key does not exist
 * const invalid = await i18n.translate('invalid.key');
 * ```
 */
export class I18n<T extends Translation = Translation> {
  private kv: KVNamespace;
  private defaultLanguage: string;
  private cache: Map<string, CacheEntry>;
  private cacheSize: number;
  private cacheTtl: number;
  private fallbackToDefault: boolean;

  constructor(config: I18nConfig) {
    this.kv = config.kv;
    this.defaultLanguage = config.defaultLanguage || "en";
    this.cacheSize = config.cacheSize || 50;
    this.cacheTtl = config.cacheTtl || 300;
    this.fallbackToDefault = config.fallbackToDefault !== false;
    this.cache = new Map();
  }

  /**
   * Retrieves a translation for a specific path using dot notation with ICU message format support.
   *
   * @param key - Type-safe dot-separated path to the translation
   * @param options - Optional translation options including ICU parameters and language
   * @returns Promise that resolves to the translation string, or a fallback message if not found
   *
   * @example
   * ```typescript
   * // Simple translation
   * const greeting = await i18n.translate('commands.ping.name');
   *
   * // With language override
   * const greeting = await i18n.translate('commands.ping.name', { language: 'nl' });
   *
   * // With ICU parameters
   * const message = await i18n.translate('commands.ping.messages.success', {
   *   params: { rtt: 42 },
   *   language: 'en-US'
   * });
   *
   * // ICU pluralization
   * const count = await i18n.translate('common.labels.winners', {
   *   params: { count: 5 }
   * });
   * ```
   */
  async translate(
    key: I18nKey<T>,
    options?: TranslateOptions
  ): Promise<string> {
    const requestedLang = options?.language || this.defaultLanguage;
    const params = options?.params;

    // Try to get translation from requested language
    let result = await this.getTranslationForLanguage(
      key,
      requestedLang,
      params
    );

    // If translation not found and fallback is enabled, try default language
    if (
      result === null &&
      this.fallbackToDefault &&
      requestedLang !== this.defaultLanguage
    ) {
      result = await this.getTranslationForLanguage(
        key,
        this.defaultLanguage,
        params
      );
    }

    // still nothing? return a fallback
    if (result === null) {
      return `[[${key}]] (TRANSLATION MISSING)`;
    }

    return result;
  }

  /**
   * Retrieves translations for a specific path across all available languages.
   *
   * @param key - Type-safe dot-separated path to the translation
   * @param params - Optional parameters for ICU message formatting
   * @returns Promise that resolves to a record mapping language codes to translation strings
   */
  async translateAll(
    key: I18nKey<T>,
    params?: ICUParams
  ): Promise<Record<string, string>> {
    const languages = await this.getAvailableLanguages();
    const result: Record<string, string> = {};

    const promises = languages.map(async (lang) => {
      const translation = await this.getTranslationForLanguage(
        key,
        lang,
        params
      );
      if (translation !== null) {
        result[lang] = translation;
      }
    });

    await Promise.all(promises);
    return result;
  }

  /**
   * Retrieves all available language codes from the KV store.
   */
  async getAvailableLanguages(): Promise<string[]> {
    const cacheKey = "_languages";
    const cached = this.getCachedEntry(cacheKey);

    if (cached) {
      return cached.data as unknown as string[];
    }

    const list = await this.kv.list({ prefix: "locale:" });
    const languages = new Set<string>();

    list.keys.forEach((key) => {
      const match = key.name.match(/^locale:([^:]+)$/);
      if (match) {
        languages.add(match[1]);
      }
    });

    const languageArray = Array.from(languages);
    this.setCacheEntry(cacheKey, languageArray as unknown as Translation);
    return languageArray;
  }

  /**
   * Sets a single translation for a specific path and language.
   */
  async setTranslation(
    path: string,
    value: string,
    language?: string
  ): Promise<void> {
    const lang = language || this.defaultLanguage;
    const translations = (await this.getTranslations(lang)) || {};

    this.setNestedValue(translations, path, value);

    const kvKey = `locale:${lang}`;
    await this.kv.put(kvKey, JSON.stringify(translations));

    this.cache.delete(lang);
  }

  /**
   * Sets multiple translations at once for a specific language.
   */
  async setTranslations(
    translations: Record<string, string> | Translation,
    language?: string
  ): Promise<void> {
    const lang = language || this.defaultLanguage;
    const existingTranslations = (await this.getTranslations(lang)) || {};

    for (const [key, value] of Object.entries(translations)) {
      if (typeof value === "string") {
        this.setNestedValue(existingTranslations, key, value);
      } else if (typeof value === "object" && value !== null) {
        if (
          !(key in existingTranslations) ||
          typeof existingTranslations[key] !== "object"
        ) {
          existingTranslations[key] = {};
        }
        this.deepMerge(existingTranslations[key] as Translation, value);
      }
    }

    const kvKey = `locale:${lang}`;
    await this.kv.put(kvKey, JSON.stringify(existingTranslations));

    this.cache.delete(lang);
  }

  private async getTranslations(language: string): Promise<Translation | null> {
    const cached = this.getCachedEntry(language);
    if (cached) {
      return cached.data;
    }

    const kvKey = `locale:${language}`;
    const value = await this.kv.get(kvKey, "json");

    if (!value) {
      return null;
    }

    try {
      const translations = value as Translation;
      this.setCacheEntry(language, translations);
      return translations;
    } catch (_error) {
      return null;
    }
  }

  private getCachedEntry(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  private setCacheEntry(key: string, data: Translation): void {
    if (this.cache.size >= this.cacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.cacheTtl,
    });
  }

  private getNestedValue(obj: Translation, path: string): string | null {
    const keys = path.split(".");
    let current: Translation | string = obj;

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        return null;
      }
    }

    return typeof current === "string" ? current : null;
  }

  private setNestedValue(obj: Translation, path: string, value: string): void {
    const keys = path.split(".");
    let current: Translation | string = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== "object") {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  private formatICUMessage(
    message: string,
    params: ICUParams,
    language: string
  ): string {
    try {
      const formatter = new IntlMessageFormat(message, language);
      const processedParams: Record<string, string | number | boolean | Date> =
        {};
      for (const [key, value] of Object.entries(params)) {
        if (typeof value === "boolean") {
          processedParams[key] = String(value);
        } else if (value instanceof Date) {
          processedParams[key] = value.toString();
        } else {
          processedParams[key] = value;
        }
      }
      const result = formatter.format(processedParams);
      return typeof result === "string" ? result : String(result);
    } catch (_error) {
      return message;
    }
  }

  private deepMerge(target: Translation, source: Translation): void {
    for (const [key, value] of Object.entries(source)) {
      if (typeof value === "string") {
        target[key] = value;
      } else if (typeof value === "object" && value !== null) {
        if (!(key in target) || typeof target[key] !== "object") {
          target[key] = {};
        }
        this.deepMerge(target[key] as Translation, value);
      }
    }
  }

  private async getTranslationForLanguage(
    path: string,
    language: string,
    params?: ICUParams
  ): Promise<string | null> {
    const translations = await this.getTranslations(language);
    if (!translations) {
      return null;
    }

    const rawMessage = this.getNestedValue(translations, path);
    if (rawMessage === null) {
      return null;
    }

    if (!params || Object.keys(params).length === 0) {
      return rawMessage;
    }

    return this.formatICUMessage(rawMessage, params, language);
  }
}

/**
 * Factory function to create a type-safe I18n instance.
 *
 * @template T - The translation object type for compile-time key validation
 * @param config - Configuration object for the I18n instance
 * @returns A new I18n instance with type-safe translate methods
 *
 * @example
 * ```typescript
 * import type translations from './i18n/en-US';
 * import { createI18n } from '@dougley/frugal-i18n';
 *
 * const i18n = createI18n<typeof translations>({
 *   kv: env.KV,
 *   defaultLanguage: 'en-US',
 * });
 *
 * // Type-safe - compiler validates key exists
 * await i18n.translate('commands.ping.name');
 *
 * // Compile error: key does not exist
 * await i18n.translate('invalid.key');
 * ```
 */
export function createI18n<T extends Translation = Translation>(
  config: I18nConfig
): I18n<T> {
  return new I18n<T>(config);
}
