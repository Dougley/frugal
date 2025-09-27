import { AsyncLocalStorage } from "node:async_hooks";
import type { drizzleD1 } from "@dougley/frugal-drizzle/workers";
import type { createI18n } from "@dougley/frugal-i18n";
import type { createProxy } from "@dougley/frugal-savestate";

export interface AppContext {
  env: Env;
  state: ReturnType<typeof createProxy>;
  drizzle: ReturnType<typeof drizzleD1>;
  i18n: ReturnType<typeof createI18n>;
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
