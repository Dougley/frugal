import { createI18n } from "./index";

// Example usage in a Cloudflare Worker
export default {
  async fetch(request: Request, env: { KV: KVNamespace }): Promise<Response> {
    // Initialize the i18n instance
    const i18n = createI18n({
      kv: env.KV,
      defaultLanguage: "en",
      cacheSize: 100,
      cacheTtl: 600, // 10 minutes
    });

    // Set up some example translations
    await i18n.setTranslations(
      {
        "hello.world": "Hello, World!",
        "hello.user": "Hello, {name}!",
        "buttons.submit": "Submit",
        "buttons.cancel": "Cancel",
        "errors.not_found": "Page not found",
        "items.count":
          "{count, plural, =0 {no items} one {# item} other {# items}}",
        welcome:
          "Welcome, {name}! You have {count, plural, =0 {no messages} one {# message} other {# messages}}.",
      },
      "en",
    );

    await i18n.setTranslations(
      {
        "hello.world": "Hola, Mundo!",
        "hello.user": "¡Hola, {name}!",
        "buttons.submit": "Enviar",
        "buttons.cancel": "Cancelar",
        "errors.not_found": "Página no encontrada",
        "items.count":
          "{count, plural, =0 {ningún elemento} one {# elemento} other {# elementos}}",
        welcome:
          "¡Bienvenido, {name}! Tienes {count, plural, =0 {ningún mensaje} one {# mensaje} other {# mensajes}}.",
      },
      "es",
    );

    await i18n.setTranslations(
      {
        "hello.world": "Bonjour le monde!",
        "buttons.submit": "Soumettre",
        "buttons.cancel": "Annuler",
        "errors.not_found": "Page non trouvée",
      },
      "fr",
    );

    // Get user's preferred language from Accept-Language header
    const acceptLanguage = request.headers.get("Accept-Language") || "en";
    const language = acceptLanguage.split(",")[0].split("-")[0]; // Get primary language code

    // Translate specific keys
    const greeting = await i18n.translate("hello.world", { language });
    const submitButton = await i18n.translate("buttons.submit", { language });

    // ICU message examples
    const personalGreeting = await i18n.translate("hello.user", {
      params: { name: "John" },
      language,
    });
    const itemCount = await i18n.translate("items.count", {
      params: { count: 5 },
      language,
    });
    const welcomeMessage = await i18n.translate("welcome", {
      params: { name: "Alice", count: 3 },
      language,
    });

    // Get all translations for a specific path
    const allButtonSubmit = await i18n.translateAll("buttons.submit");

    // Get all translations with ICU parameters
    const allItemCounts = await i18n.translateAll("items.count", { count: 2 });

    // Available languages
    const availableLanguages = await i18n.getAvailableLanguages();

    return Response.json({
      greeting,
      submitButton,
      personalGreeting,
      itemCount,
      welcomeMessage,
      allTranslations: allButtonSubmit,
      allItemCounts,
      availableLanguages,
      requestedLanguage: language,
    });
  },
} satisfies ExportedHandler<{ KV: KVNamespace }>;
