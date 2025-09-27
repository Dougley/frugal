import { IntlMessageFormat } from "intl-messageformat";

/**
 * Configuration options for the I18n instance.
 *
 * @interface I18nConfig
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
 * Can include values for placeholders, pluralization, and selection.
 *
 * @interface ICUParams
 * @example
 * ```typescript
 * const params: ICUParams = {
 *   name: 'John',
 *   count: 5,
 *   gender: 'male'
 * };
 * ```
 */
export interface ICUParams {
  [key: string]: string | number | boolean | Date;
}

/**
 * Options for the translate method.
 *
 * @interface TranslateOptions
 * @example
 * ```typescript
 * // Simple language specification
 * const options: TranslateOptions = { language: 'en' };
 *
 * // With ICU parameters
 * const options: TranslateOptions = {
 *   params: { name: 'John', count: 5 },
 *   language: 'es'
 * };
 * ```
 */
export interface TranslateOptions {
  /** Parameters for ICU message formatting */
  params?: ICUParams;
  /** Language code. If not provided, uses the default language */
  language?: string;
}

/**
 * Represents a nested translation object with string values at leaf nodes.
 * Supports deep nesting for organized translation structures.
 *
 * @interface Translation
 * @example
 * ```typescript
 * const translations: Translation = {
 *   hello: {
 *     world: "Hello, World!",
 *     user: "Hello, User!"
 *   },
 *   buttons: {
 *     submit: "Submit",
 *     cancel: "Cancel"
 *   }
 * };
 * ```
 */
export interface Translation {
  [key: string]: string | Translation;
}

/**
 * Internal cache entry structure with TTL tracking.
 *
 * @interface CacheEntry
 * @internal
 */
export interface CacheEntry {
  /** The cached translation data */
  data: Translation;
  /** Timestamp when the entry was cached (in milliseconds) */
  timestamp: number;
  /** Time-to-live for this specific entry (in seconds) */
  ttl: number;
}

/**
 * Main I18n class providing internationalization features for Cloudflare Workers.
 *
 * Features:
 * - KV-backed persistent storage
 * - LRU cache with TTL for performance
 * - Dot notation path support
 * - Multi-language translation fetching
 *
 * @class I18n
 * @example
 * ```typescript
 * const i18n = new I18n({
 *   kv: env.KV,
 *   defaultLanguage: 'en',
 *   cacheSize: 100,
 *   cacheTtl: 600
 * });
 *
 * // Set translations
 * await i18n.setTranslation('hello.world', 'Hello, World!', 'en');
 *
 * // Get translation
 * const greeting = await i18n.translate('hello.world', 'en');
 * ```
 */
export class I18n {
  private kv: KVNamespace;
  private defaultLanguage: string;
  private cache: Map<string, CacheEntry>;
  private cacheSize: number;
  private cacheTtl: number;
  private fallbackToDefault: boolean;

  /**
   * Creates a new I18n instance.
   *
   * @param config - Configuration object for the I18n instance
   * @throws {Error} If KV namespac1e is not provided
   */
  constructor(config: I18nConfig) {
    this.kv = config.kv;
    this.defaultLanguage = config.defaultLanguage || "en";
    this.cacheSize = config.cacheSize || 50; // Reasonable cache size
    this.cacheTtl = config.cacheTtl || 300; // 5 minutes default TTL
    this.fallbackToDefault = config.fallbackToDefault !== false; // Default to true
    this.cache = new Map();
  }

  /**
   * Retrieves a translation for a specific path using dot notation with ICU message format support.
   *
   * @param path - Dot-separated path to the translation (e.g., 'buttons.submit', 'errors.not_found')
   * @param options - Optional translation options including ICU parameters and language
   * @returns Promise that resolves to the translation string, or a fallback message if not found
   *
   * @example
   * ```typescript
   * // Simple translation using default language
   * const greeting = await i18n.translate('hello.world');
   * // Returns: "Hello, World!"
   *
   * // Specify language only
   * const greeting = await i18n.translate('hello.world', { language: 'en' });
   * // Returns: "Hello, World!"
   *
   * // ICU parameters only (uses default language)
   * const message = await i18n.translate('welcome', { params: { name: 'John' } });
   * // For template: "Hello {name}!" returns: "Hello John!"
   *
   * // ICU with parameters and specific language
   * const message = await i18n.translate('welcome', {
   *   params: { name: 'John' },
   *   language: 'en'
   * });
   * // For template: "Hello {name}!" returns: "Hello John!"
   *
   * // ICU with pluralization
   * const itemCount = await i18n.translate('items', {
   *   params: { count: 5 },
   *   language: 'en'
   * });
   * // For template: "{count, plural, =0 {no items} one {# item} other {# items}}"
   * // Returns: "5 items"
   * ```
   */
  async translate(path: string, options?: TranslateOptions): Promise<string> {
    const requestedLang = options?.language || this.defaultLanguage;
    const params = options?.params;

    // Try to get translation from requested language
    let result = await this.getTranslationForLanguage(
      path,
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
        path,
        this.defaultLanguage,
        params
      );
    }

    // still nothing? return a fallback
    if (result === null) {
      return `[[${path}]] (TRANSLATION MISSING)`;
    }

    return result;
  }

  /**
   * Retrieves translations for a specific path across all available languages.
   * Useful for displaying all language variants of a text or building language selectors.
   *
   * @param path - Dot-separated path to the translation
   * @param params - Optional parameters for ICU message formatting (applied to all languages)
   * @returns Promise that resolves to a record mapping language codes to translation strings
   *
   * @example
   * ```typescript
   * const allGreetings = await i18n.translateAll('hello.world');
   * // Returns: {
   * //   en: "Hello, World!",
   * //   es: "Hola, Mundo!",
   * //   fr: "Bonjour le monde!"
   * // }
   *
   * // Use for building language selector options with ICU parameters
   * const itemCounts = await i18n.translateAll('items.count', { count: 5 });
   * // Returns: {
   * //   en: "5 items",
   * //   es: "5 elementos",
   * //   fr: "5 éléments"
   * // }
   * ```
   */
  async translateAll(
    path: string,
    params?: ICUParams
  ): Promise<Record<string, string>> {
    // First, get available languages from KV
    const languages = await this.getAvailableLanguages();
    const result: Record<string, string> = {};

    // Fetch translations for each language in parallel (without fallback)
    const promises = languages.map(async (lang) => {
      const translation = await this.getTranslationForLanguage(
        path,
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
   * Results are cached for performance.
   *
   * @returns Promise that resolves to an array of language codes
   *
   * @example
   * ```typescript
   * const languages = await i18n.getAvailableLanguages();
   * // Returns: ['en', 'es', 'fr', 'de']
   *
   * // Use for building language selector
   * const languageOptions = languages.map(lang => ({ value: lang, label: lang.toUpperCase() }));
   * ```
   */
  async getAvailableLanguages(): Promise<string[]> {
    const cacheKey = "_languages";
    const cached = this.getCachedEntry(cacheKey);

    if (cached) {
      return cached.data as unknown as string[];
    }

    // List all translation keys to determine available languages
    const list = await this.kv.list({ prefix: "locale:" });
    const languages = new Set<string>();

    // for (const key of list.keys) {
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
   * Creates nested objects as needed to support the dot notation path.
   * Invalidates the cache for the specified language.
   *
   * @param path - Dot-separated path where to store the translation
   * @param value - The translation string
   * @param language - Language code. If not provided, uses the default language
   * @returns Promise that resolves when the translation is stored
   *
   * @example
   * ```typescript
   * // Set a simple translation
   * await i18n.setTranslation('hello', 'Hello!', 'en');
   *
   * // Set a nested translation
   * await i18n.setTranslation('buttons.submit', 'Submit', 'en');
   * await i18n.setTranslation('buttons.submit', 'Enviar', 'es');
   *
   * // Use default language
   * await i18n.setTranslation('welcome', 'Welcome!');
   * ```
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

    // Invalidate cache for this language
    this.cache.delete(lang);
  }

  /**
   * Sets multiple translations at once for a specific language.
   * More efficient than calling setTranslation multiple times.
   * Invalidates the cache for the specified language.
   *
   * Supports both flat dot-notation format and nested object format.
   *
   * @param translations - Either a flat record with dot-notation paths or a nested translation object
   * @param language - Language code. If not provided, uses the default language
   * @returns Promise that resolves when all translations are stored
   *
   * @example
   * ```typescript
   * // Flat format with dot-notation
   * await i18n.setTranslations({
   *   'hello.world': 'Hello, World!',
   *   'hello.user': 'Hello, User!',
   *   'buttons.submit': 'Submit'
   * }, 'en');
   *
   * // Nested object format (recommended)
   * await i18n.setTranslations({
   *   hello: {
   *     world: 'Hello, World!',
   *     user: 'Hello, User!'
   *   },
   *   buttons: {
   *     submit: 'Submit'
   *   }
   * }, 'en');
   * ```
   */
  async setTranslations(
    translations: Record<string, string> | Translation,
    language?: string
  ): Promise<void> {
    const lang = language || this.defaultLanguage;
    const existingTranslations = (await this.getTranslations(lang)) || {};

    // Process each entry individually to handle mixed formats
    for (const [key, value] of Object.entries(translations)) {
      if (typeof value === "string") {
        // Handle flat dot-notation format
        this.setNestedValue(existingTranslations, key, value);
      } else if (typeof value === "object" && value !== null) {
        // Handle nested format - merge directly at this key
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

    // Invalidate cache for this language
    this.cache.delete(lang);
  }

  /**
   * Retrieves translations for a specific language from KV storage with caching.
   * Implements LRU cache with TTL for optimal performance.
   *
   * @private
   * @param language - Language code to fetch translations for
   * @returns Promise that resolves to the translation object, or null if not found
   */
  private async getTranslations(language: string): Promise<Translation | null> {
    // Check cache first
    const cached = this.getCachedEntry(language);
    if (cached) {
      return cached.data;
    }

    // Fetch from KV
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
      // Silent error handling in Workers environment
      return null;
    }
  }

  /**
   * Retrieves a cached entry if it exists and hasn't expired.
   * Automatically removes expired entries.
   *
   * @private
   * @param key - Cache key to retrieve
   * @returns The cache entry if valid, null otherwise
   */
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

  /**
   * Stores an entry in the cache with LRU eviction when cache is full.
   * Automatically removes the oldest entry if cache size limit is reached.
   *
   * @private
   * @param key - Cache key to store under
   * @param data - Translation data to cache
   */
  private setCacheEntry(key: string, data: Translation): void {
    // LRU eviction - remove oldest entries if cache is full
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

  /**
   * Retrieves a nested value from a translation object using dot notation.
   *
   * @private
   * @param obj - Translation object to search in
   * @param path - Dot-separated path to the desired value
   * @returns The translation string if found, null otherwise
   *
   * @example
   * ```typescript
   * // For obj = { hello: { world: "Hello, World!" } }
   * getNestedValue(obj, "hello.world") // Returns: "Hello, World!"
   * getNestedValue(obj, "hello.invalid") // Returns: null
   * ```
   */
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

  /**
   * Sets a nested value in a translation object using dot notation.
   * Creates intermediate objects as needed.
   *
   * @private
   * @param obj - Translation object to modify
   * @param path - Dot-separated path where to set the value
   * @param value - The string value to set
   *
   * @example
   * ```typescript
   * const obj = {};
   * setNestedValue(obj, "hello.world", "Hello, World!");
   * // obj becomes: { hello: { world: "Hello, World!" } }
   * ```
   */
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

  /**
   * Formats an ICU message with the provided parameters.
   *
   * @private
   * @param message - The ICU message template to format
   * @param params - Parameters for ICU message formatting
   * @param language - Language code for locale-specific formatting
   * @returns Formatted message string, or the original message if parsing fails
   *
   * @example
   * ```typescript
   * // Simple interpolation
   * formatICUMessage("Hello {name}!", { name: "John" }, "en")
   * // Returns: "Hello John!"
   *
   * // Pluralization
   * formatICUMessage("{count, plural, one {# item} other {# items}}", { count: 5 }, "en")
   * // Returns: "5 items"
   * ```
   */
  private formatICUMessage(
    message: string,
    params: ICUParams,
    language: string
  ): string {
    try {
      const formatter = new IntlMessageFormat(message, language);
      // Convert params to ensure proper formatting
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
      // If parsing/formatting fails, return the original message
      return message;
    }
  }

  /**
   * Deep merges a source translation object into a target translation object.
   * Modifies the target object in place.
   *
   * @private
   * @param target - The target translation object to merge into
   * @param source - The source translation object to merge from
   */
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

  /**
   * Core translation method that retrieves and formats a translation for a specific language.
   * Does not include fallback logic - used by both translate() and translateAll().
   *
   * @private
   * @param path - Dot-separated path to the translation
   * @param language - Language code to translate for
   * @param params - Optional ICU parameters
   * @returns Promise that resolves to the translation string, or null if not found
   */
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

    // If no params provided, return the raw message (no ICU processing needed)
    if (!params || Object.keys(params).length === 0) {
      return rawMessage;
    }

    // Parse and format ICU message
    return this.formatICUMessage(rawMessage, params, language);
  }
}

/**
 * Factory function to create a new I18n instance with the provided configuration.
 * Recommended way to instantiate the I18n class.
 *
 * @param config - Configuration object for the I18n instance
 * @returns A new I18n instance
 *
 * @example
 * ```typescript
 * import { createI18n } from '@dougley/frugal-i18n';
 *
 * export default {
 *   async fetch(request: Request, env: { KV: KVNamespace }) {
 *     const i18n = createI18n({
 *       kv: env.KV,
 *       defaultLanguage: 'en',
 *       cacheSize: 100,
 *       cacheTtl: 600,
 *       fallbackToDefault: true // Enable fallback to default language (default: true)
 *     });
 *
 *     const greeting = await i18n.translate('hello.world');
 *     return new Response(greeting);
 *   }
 * };
 * ```
 */
export function createI18n(config: I18nConfig): I18n {
  return new I18n(config);
}
