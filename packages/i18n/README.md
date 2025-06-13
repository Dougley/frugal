# @dougley/frugal-i18n

A powerful internationalization (i18n) library for Cloudflare Workers with ICU message format support.

## Features

- **KV-backed persistent storage** - Store translations in Cloudflare KV
- **LRU cache with TTL** - High-performance in-memory caching
- **Dot notation paths** - Organize translations hierarchically
- **ICU message format** - Support for pluralization, interpolation, and selection
- **Multi-language support** - Fetch translations across all languages
- **TypeScript support** - Full type safety and IntelliSense

## Installation

```bash
npm install @dougley/frugal-i18n
```

## Usage

```typescript
import { createI18n } from "@dougley/frugal-i18n";

const i18n = createI18n({
  kv: env.KV,
  defaultLanguage: "en",
  cacheSize: 100,
  cacheTtl: 600,
});

// Simple translation
await i18n.setTranslation("hello", "Hello!", "en");
const greeting = await i18n.translate("hello"); // "Hello!"

// ICU with parameters
await i18n.setTranslation("welcome", "Hello, {name}!", "en");
const message = await i18n.translate("welcome", {
  params: { name: "John" },
  language: "en",
});
// Returns: "Hello, John!"
```

## ICU Message Format Support

This library supports the full ICU message format syntax for dynamic content:

- **Interpolation** - Insert variables: `"Hello {name}!"`
- **Pluralization** - Handle counts: `"{count, plural, one {# item} other {# items}}"`
- **Selection** - Conditional text: `"{gender, select, male {Mr.} female {Ms.} other {}}"`

```typescript
// Pluralization example
await i18n.setTranslation(
  "items",
  "{count, plural, =0 {no items} one {# item} other {# items}}",
  "en",
);

const result = await i18n.translate("items", {
  params: { count: 5 },
  language: "en",
});
// Returns: "5 items"

// Selection example
await i18n.setTranslation(
  "greeting",
  "{gender, select, male {Hello sir} female {Hello madam} other {Hello}}",
  "en",
);

// Complex combinations work seamlessly
await i18n.setTranslation(
  "notification",
  "Hello {name}! You have {count, plural, =0 {no messages} one {# message} other {# messages}}.",
  "en",
);
```