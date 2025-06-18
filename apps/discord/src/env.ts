import type { drizzleD1 } from "@dougley/frugal-drizzle/workers";
import type { createI18n } from "@dougley/frugal-i18n";
import type { createProxy } from "@dougley/frugal-savestate";

export const EnvContext = {
  env: null as Env | null,
  state: null as ReturnType<typeof createProxy> | null,
  drizzle: null as ReturnType<typeof drizzleD1> | null,
  i18n: null as ReturnType<typeof createI18n> | null,
};
