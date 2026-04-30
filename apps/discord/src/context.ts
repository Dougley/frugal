import { AsyncLocalStorage } from "node:async_hooks";
import type { drizzleD1 } from "@dougley/frugal-drizzle/workers";
import type { I18n } from "@dougley/frugal-i18n";
import type translations from "@dougley/frugal-i18n/locales/en-US";
import type { createProxy } from "@dougley/frugal-savestate";

/**
 * Type alias for the translation keys available in the app.
 * This is derived from the en-US translation file (source of truth).
 */
export type AppTranslations = typeof translations;

export interface AppContext {
  env: Env;
  state: ReturnType<typeof createProxy>;
  drizzle: ReturnType<typeof drizzleD1>;
  i18n: I18n<AppTranslations>;
}

const contextStorage = new AsyncLocalStorage<AppContext>();

export function getContext(): AppContext {
  const context = contextStorage.getStore();
  if (!context) {
    throw new Error(
      "Context not available. Make sure the request is running within a context."
    );
  }
  return context;
}

export function runWithContext<T>(
  context: AppContext,
  fn: () => Promise<T>
): Promise<T> {
  return contextStorage.run(context, fn);
}

export function tryGetContext(): AppContext | undefined {
  return contextStorage.getStore();
}
