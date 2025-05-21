import { TRPCError } from "@trpc/server";
import { type t } from "./router";

const DEFAULT_RATE_LIMIT_COOLDOWN = 5000; // 5 seconds

export type RateLimitOptions = {
  /**
   * The name of the property in the input containing the identifier to rate limit by
   * @default 'user_id'
   */
  identifierKey?: string;

  /**
   * Action name for the rate limit (will be part of the storage key)
   * @default The procedure path
   */
  action?: string;

  /**
   * Cooldown period in milliseconds
   * @default 5000 (5 seconds)
   */
  cooldown?: number;

  /**
   * Custom function to extract the identifier from the input
   * Takes precedence over identifierKey if provided
   */
  getIdentifier?: (input: unknown) => string | undefined;
};

/**
 * Creates a rate limiting middleware with the specified options
 */
const createRateLimitMiddleware = (t: t, options: RateLimitOptions = {}) => {
  const {
    identifierKey = "user_id",
    cooldown = DEFAULT_RATE_LIMIT_COOLDOWN,
    getIdentifier,
  } = options;

  return t.middleware(async ({ ctx, input, next, path }) => {
    // Get the identifier to rate limit by
    let identifier: string | undefined;

    if (getIdentifier) {
      // Use custom function if provided
      identifier = getIdentifier(input);
    } else if (typeof input === "object" && input !== null) {
      // Otherwise extract from input using the configured key
      identifier = (input as Record<string, unknown>)[identifierKey] as
        | string
        | undefined;
    }

    if (!identifier) {
      // Skip rate limiting if we can't determine the identifier
      console.warn(
        `Rate limiting skipped for ${path}: identifier not found in input`,
        input,
      );
      return next();
    }

    // Determine the action name (for storage key)
    const action = options.action || path;

    // Create table if it doesn't exist
    ctx.state.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        action TEXT NOT NULL,
        identifier TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        PRIMARY KEY (action, identifier)
      )
    `);

    const now = Date.now();

    // Check if rate limited using a single query with bindings
    const result = ctx.state.storage.sql
      .exec(
        `
      WITH current_limit AS (
        SELECT timestamp 
        FROM rate_limits 
        WHERE action = ? AND identifier = ?
      ),
      time_check AS (
        SELECT 
          timestamp,
          ? - timestamp AS time_elapsed,
          ? AS required_cooldown,
          (? - timestamp < ?) AS is_limited,
          ? - (? - timestamp) AS retry_after
        FROM current_limit
      )
      SELECT 
        CASE WHEN timestamp IS NULL THEN 1 
             WHEN is_limited = 0 THEN 1
             ELSE 0 
        END AS success,
        CASE WHEN is_limited = 1 THEN retry_after ELSE NULL END AS retry_after
      FROM time_check
    `,
        action,
        identifier,
        now,
        cooldown,
        now,
        cooldown,
        cooldown,
        now,
      )
      .toArray();

    // Get the result (or default if no row was returned)
    const { success = 1, retry_after = null } = result[0] || {};

    console.log(
      `Rate limit check for ${action} by ${identifier}: success=${success}, retry_after=${retry_after}`,
      result,
    );

    // Check if rate limited
    if (!success) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limited. Try again in ${Math.ceil(
          (retry_after as number) / 1000,
        )} seconds.`,
      });
    }

    // Update the rate limit timestamp
    ctx.state.storage.sql.exec(
      "INSERT OR REPLACE INTO rate_limits (action, identifier, timestamp) VALUES (?, ?, ?)",
      action,
      identifier,
      now,
    );

    return next();
  });
};

export default createRateLimitMiddleware;
