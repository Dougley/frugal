import { drizzleD1 } from "@dougley/frugal-drizzle/workers";
import * as Sentry from "@sentry/cloudflare";

/**
 * Check if we're running in development mode
 *
 * In Vite SSR dev mode, Sentry's D1 instrumentation causes infinite recursion
 * due to proxy conflicts. We disable instrumentation in dev to avoid this.
 */
const isDev =
  typeof process !== "undefined" && process.env.NODE_ENV === "development";

/**
 * Create a database instance with optional Sentry instrumentation
 *
 * Uses Sentry's D1 instrumentation in production to capture query spans
 * for distributed tracing. Disabled in development to avoid stack overflow
 * issues with Vite's SSR dev server.
 */
export function createDb(d1: D1Database) {
  // Skip instrumentation in dev to avoid Vite SSR proxy conflicts
  if (isDev) {
    return drizzleD1(d1);
  }
  const instrumentedD1 = Sentry.instrumentD1WithSentry(d1);
  return drizzleD1(instrumentedD1);
}

export type Database = ReturnType<typeof createDb>;
