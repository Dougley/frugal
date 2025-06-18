import { beforeEach, describe, expect, it, vi } from "vitest";
import { createI18n, I18n } from "../index.js";
import { MockKVNamespace } from "./mocks/kv.js";

describe("I18n", () => {
  let mockKV: MockKVNamespace;
  let i18n: I18n;

  beforeEach(() => {
    mockKV = new MockKVNamespace();
    i18n = createI18n({
      kv: mockKV as unknown as KVNamespace,
      defaultLanguage: "en",
      cacheSize: 10,
      cacheTtl: 300,
    });
  });

  describe("Constructor and Factory", () => {
    it("should create an instance with default config", () => {
      const instance = createI18n({ kv: mockKV as unknown as KVNamespace });
      expect(instance).toBeInstanceOf(I18n);
    });

    it("should use provided configuration", () => {
      const instance = createI18n({
        kv: mockKV as unknown as KVNamespace,
        defaultLanguage: "es",
        cacheSize: 100,
        cacheTtl: 600,
      });
      expect(instance).toBeInstanceOf(I18n);
    });
  });

  describe("setTranslation", () => {
    it("should set a simple translation", async () => {
      await i18n.setTranslation("hello", "Hello!", "en");
      const result = await i18n.translate("hello", { language: "en" });
      expect(result).toBe("Hello!");
    });

    it("should set nested translations using dot notation", async () => {
      await i18n.setTranslation("buttons.submit", "Submit", "en");
      const result = await i18n.translate("buttons.submit", { language: "en" });
      expect(result).toBe("Submit");
    });

    it("should use default language when not specified", async () => {
      await i18n.setTranslation("hello", "Hello Default!");
      const result = await i18n.translate("hello");
      expect(result).toBe("Hello Default!");
    });

    it("should create nested structure automatically", async () => {
      await i18n.setTranslation("deeply.nested.path", "Deep Value", "en");
      const result = await i18n.translate("deeply.nested.path", {
        language: "en",
      });
      expect(result).toBe("Deep Value");
    });
  });

  describe("setTranslations", () => {
    it("should set multiple translations at once", async () => {
      await i18n.setTranslations(
        {
          hello: "Hello!",
          goodbye: "Goodbye!",
          "buttons.submit": "Submit",
        },
        "en"
      );

      expect(await i18n.translate("hello", { language: "en" })).toBe("Hello!");
      expect(await i18n.translate("goodbye", { language: "en" })).toBe(
        "Goodbye!"
      );
      expect(await i18n.translate("buttons.submit", { language: "en" })).toBe(
        "Submit"
      );
    });

    it("should merge with existing translations", async () => {
      await i18n.setTranslation("existing", "Existing Value", "en");
      await i18n.setTranslations(
        {
          new: "New Value",
          "buttons.submit": "Submit",
        },
        "en"
      );

      expect(await i18n.translate("existing", { language: "en" })).toBe(
        "Existing Value"
      );
      expect(await i18n.translate("new", { language: "en" })).toBe("New Value");
      expect(await i18n.translate("buttons.submit", { language: "en" })).toBe(
        "Submit"
      );
    });

    it("should support nested object format", async () => {
      await i18n.setTranslations(
        {
          hello: {
            world: "Hello, World!",
            user: "Hello, User!",
          },
          buttons: {
            submit: "Submit",
            cancel: "Cancel",
          },
          simple: "Simple Value",
        },
        "en"
      );

      expect(await i18n.translate("hello.world", { language: "en" })).toBe(
        "Hello, World!"
      );
      expect(await i18n.translate("hello.user", { language: "en" })).toBe(
        "Hello, User!"
      );
      expect(await i18n.translate("buttons.submit", { language: "en" })).toBe(
        "Submit"
      );
      expect(await i18n.translate("buttons.cancel", { language: "en" })).toBe(
        "Cancel"
      );
      expect(await i18n.translate("simple", { language: "en" })).toBe(
        "Simple Value"
      );
    });

    it("should support deeply nested object format", async () => {
      await i18n.setTranslations(
        {
          deeply: {
            nested: {
              path: {
                value: "Deep Value",
              },
            },
          },
        },
        "en"
      );

      expect(
        await i18n.translate("deeply.nested.path.value", { language: "en" })
      ).toBe("Deep Value");
    });

    it("should mix flat and nested formats", async () => {
      await i18n.setTranslations(
        {
          "flat.key": "Flat Value",
          nested: {
            key: "Nested Value",
          },
        },
        "en"
      );

      expect(await i18n.translate("flat.key", { language: "en" })).toBe(
        "Flat Value"
      );
      expect(await i18n.translate("nested.key", { language: "en" })).toBe(
        "Nested Value"
      );
    });
  });

  describe("translate - Basic Functionality", () => {
    beforeEach(async () => {
      await i18n.setTranslations(
        {
          hello: "Hello!",
          "buttons.submit": "Submit",
          "nested.deep.value": "Deep Value",
        },
        "en"
      );

      await i18n.setTranslations(
        {
          hello: "Hola!",
          "buttons.submit": "Enviar",
        },
        "es"
      );
    });

    it("should return translation using default language", async () => {
      const result = await i18n.translate("hello");
      expect(result).toBe("Hello!");
    });

    it("should return translation for specific language", async () => {
      const result = await i18n.translate("hello", { language: "es" });
      expect(result).toBe("Hola!");
    });

    it("should return null for non-existent translation", async () => {
      const result = await i18n.translate("nonexistent", { language: "en" });
      expect(result).toBeNull();
    });

    it("should return null for non-existent language", async () => {
      // With fallback enabled (default), should fallback to default language
      const result = await i18n.translate("hello", { language: "fr" });
      expect(result).toBe("Hello!"); // Falls back to English translation
    });

    it("should handle nested paths correctly", async () => {
      const result = await i18n.translate("nested.deep.value", {
        language: "en",
      });
      expect(result).toBe("Deep Value");
    });

    it("should return null for invalid nested path", async () => {
      const result = await i18n.translate("nested.invalid.path", {
        language: "en",
      });
      expect(result).toBeNull();
    });

    it("should fallback to default language when translation missing in requested language", async () => {
      // Set up: English has the translation, Spanish doesn't have this specific key
      await i18n.setTranslation("english_only", "English Only", "en");

      // Request Spanish (which doesn't have this key) - should fallback to English (default)
      const result = await i18n.translate("english_only", { language: "es" });
      expect(result).toBe("English Only");
    });

    it("should fallback to default language when requested language doesn't exist", async () => {
      // Set up: English (default) has the translation
      await i18n.setTranslation("hello", "Hello!", "en");

      // Request non-existent language - should fallback to English (default)
      const result = await i18n.translate("hello", { language: "nonexistent" });
      expect(result).toBe("Hello!");
    });

    it("should return null when neither requested nor default language has the translation", async () => {
      // Neither Spanish nor English (default) has this translation
      const result = await i18n.translate("nonexistent", { language: "es" });
      expect(result).toBeNull();
    });

    it("should allow disabling fallback to default language", async () => {
      // Create instance with fallback disabled
      const i18nNoFallback = createI18n({
        kv: mockKV as unknown as KVNamespace,
        defaultLanguage: "en",
        fallbackToDefault: false,
      });

      // Set up: English has the translation
      await i18nNoFallback.setTranslation("english_only", "English Only", "en");

      // Request Spanish (which doesn't have this key) - should NOT fallback to English
      const result = await i18nNoFallback.translate("english_only", {
        language: "es",
      });
      expect(result).toBeNull();
    });
  });

  describe("translate - ICU Message Format", () => {
    beforeEach(async () => {
      await i18n.setTranslations(
        {
          welcome: "Hello, {name}!",
          items: "{count, plural, =0 {no items} one {# item} other {# items}}",
          greeting:
            "{gender, select, male {Hello sir} female {Hello madam} other {Hello}}",
          complex:
            "Hello {name}! You have {count, plural, =0 {no messages} one {# message} other {# messages}}.",
        },
        "en"
      );

      await i18n.setTranslations(
        {
          items:
            "{count, plural, =0 {ningún elemento} one {# elemento} other {# elementos}}",
        },
        "es"
      );
    });

    it("should handle simple parameter interpolation", async () => {
      const result = await i18n.translate("welcome", {
        params: { name: "John" },
        language: "en",
      });
      expect(result).toBe("Hello, John!");
    });

    it("should handle pluralization with zero", async () => {
      const result = await i18n.translate("items", {
        params: { count: 0 },
        language: "en",
      });
      expect(result).toBe("no items");
    });

    it("should handle pluralization with one", async () => {
      const result = await i18n.translate("items", {
        params: { count: 1 },
        language: "en",
      });
      expect(result).toBe("1 item");
    });

    it("should handle pluralization with multiple", async () => {
      const result = await i18n.translate("items", {
        params: { count: 5 },
        language: "en",
      });
      expect(result).toBe("5 items");
    });

    it("should handle selection", async () => {
      const maleResult = await i18n.translate("greeting", {
        params: { gender: "male" },
        language: "en",
      });
      expect(maleResult).toBe("Hello sir");

      const femaleResult = await i18n.translate("greeting", {
        params: { gender: "female" },
        language: "en",
      });
      expect(femaleResult).toBe("Hello madam");

      const otherResult = await i18n.translate("greeting", {
        params: { gender: "other" },
        language: "en",
      });
      expect(otherResult).toBe("Hello");
    });

    it("should handle complex ICU messages", async () => {
      const result = await i18n.translate("complex", {
        params: { name: "Alice", count: 3 },
        language: "en",
      });
      expect(result).toBe("Hello Alice! You have 3 messages.");
    });

    it("should work with different languages", async () => {
      const result = await i18n.translate("items", {
        params: { count: 5 },
        language: "es",
      });
      expect(result).toBe("5 elementos");
    });

    it("should return original message on ICU parsing error", async () => {
      await i18n.setTranslation("broken", "{invalid icu", "en");
      const result = await i18n.translate("broken", {
        params: { name: "John" },
        language: "en",
      });
      expect(result).toBe("{invalid icu");
    });

    it("should handle missing parameters gracefully", async () => {
      const result = await i18n.translate("welcome", {
        params: {},
        language: "en",
      });
      expect(result).toBe("Hello, {name}!");
    });
  });

  describe("translateAll", () => {
    beforeEach(async () => {
      await i18n.setTranslations(
        {
          hello: "Hello!",
          welcome: "Hello, {name}!",
        },
        "en"
      );

      await i18n.setTranslations(
        {
          hello: "Hola!",
          welcome: "¡Hola, {name}!",
        },
        "es"
      );

      await i18n.setTranslations(
        {
          hello: "Bonjour!",
          welcome: "Bonjour, {name}!",
        },
        "fr"
      );
    });

    it("should return translations for all languages", async () => {
      const result = await i18n.translateAll("hello");
      expect(result).toEqual({
        en: "Hello!",
        es: "Hola!",
        fr: "Bonjour!",
      });
    });

    it("should work with ICU parameters", async () => {
      const result = await i18n.translateAll("welcome", { name: "John" });
      expect(result).toEqual({
        en: "Hello, John!",
        es: "¡Hola, John!",
        fr: "Bonjour, John!",
      });
    });

    it("should only include languages that have the translation", async () => {
      await i18n.setTranslation("english_only", "English Only", "en");
      const result = await i18n.translateAll("english_only");
      expect(result).toEqual({
        en: "English Only",
      });
    });
  });

  describe("getAvailableLanguages", () => {
    it("should return empty array when no translations exist", async () => {
      const languages = await i18n.getAvailableLanguages();
      expect(languages).toEqual([]);
    });

    it("should return available languages", async () => {
      await i18n.setTranslation("hello", "Hello!", "en");
      await i18n.setTranslation("hello", "Hola!", "es");
      await i18n.setTranslation("hello", "Bonjour!", "fr");

      const languages = await i18n.getAvailableLanguages();
      expect(languages.sort()).toEqual(["en", "es", "fr"]);
    });

    it("should cache language list", async () => {
      const listSpy = vi.spyOn(mockKV, "list");

      await i18n.setTranslation("hello", "Hello!", "en");

      // First call should query KV
      await i18n.getAvailableLanguages();
      expect(listSpy).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await i18n.getAvailableLanguages();
      expect(listSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Caching", () => {
    it("should cache translations", async () => {
      const getSpy = vi.spyOn(mockKV, "get");

      await i18n.setTranslation("hello", "Hello!", "en");

      // First call should fetch from KV
      await i18n.translate("hello", { language: "en" });
      expect(getSpy).toHaveBeenCalledWith("locale:en", "json");

      getSpy.mockClear();

      // Second call should use cache
      await i18n.translate("hello", { language: "en" });
      expect(getSpy).not.toHaveBeenCalled();
    });

    it("should invalidate cache when setting translations", async () => {
      const getSpy = vi.spyOn(mockKV, "get");

      await i18n.setTranslation("hello", "Hello!", "en");
      await i18n.translate("hello", { language: "en" }); // Cache the translation

      getSpy.mockClear();

      await i18n.setTranslation("hello", "Hello Updated!", "en"); // Should invalidate cache
      const result = await i18n.translate("hello", { language: "en" });

      expect(getSpy).toHaveBeenCalledWith("locale:en", "json");
      expect(result).toBe("Hello Updated!");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string translations", async () => {
      await i18n.setTranslation("empty", "", "en");
      const result = await i18n.translate("empty", { language: "en" });
      expect(result).toBe("");
    });

    it("should handle special characters in paths", async () => {
      await i18n.setTranslation("special.chars", "Special: !@#$%^&*()", "en");
      const result = await i18n.translate("special.chars", { language: "en" });
      expect(result).toBe("Special: !@#$%^&*()");
    });

    it("should handle numeric values in ICU params", async () => {
      await i18n.setTranslation("number", "Value: {value}", "en");
      const result = await i18n.translate("number", {
        params: { value: 42 },
        language: "en",
      });
      expect(result).toBe("Value: 42");
    });

    it("should handle boolean values in ICU params", async () => {
      await i18n.setTranslation("bool", "Status: {status}", "en");
      const result = await i18n.translate("bool", {
        params: { status: true },
        language: "en",
      });
      expect(result).toBe("Status: true");
    });

    it("should handle Date values in ICU params", async () => {
      await i18n.setTranslation("date", "Date: {date}", "en");
      const testDate = new Date("2023-01-01");
      const result = await i18n.translate("date", {
        params: { date: testDate },
        language: "en",
      });
      expect(result).toBe(`Date: ${testDate.toString()}`);
    });
  });
});
