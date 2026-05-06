import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";

/**
 * Create Cloudflare KV-backed secondary storage for Better Auth
 *
 * Used for:
 * - Session data caching (faster reads than cookie decryption)
 * - Rate limiting counters
 *
 * Note: KV has a minimum TTL of 60 seconds
 */
function createKVSecondaryStorage(kv: KVNamespace) {
  return {
    get: async (key: string): Promise<string | null> => {
      return kv.get(key);
    },
    set: async (key: string, value: string, ttl?: number): Promise<void> => {
      if (ttl) {
        // KV minimum TTL is 60 seconds
        const kvTtl = Math.max(ttl, 60);
        await kv.put(key, value, { expirationTtl: kvTtl });
      } else {
        await kv.put(key, value);
      }
    },
    delete: async (key: string): Promise<void> => {
      await kv.delete(key);
    },
  };
}

/**
 * Better Auth configuration for stateless OAuth-only authentication
 *
 * Key features:
 * - Stateless mode (no database) - session stored in encrypted cookie
 * - Cloudflare KV as secondary storage for session caching and rate limiting
 * - Discord OAuth as the sole authentication method
 * - Guilds scope for fetching user's Discord servers
 * - TanStack Start cookie plugin for proper cookie handling
 *
 * Note: Cookies may be large due to JWE-encrypted session/account data.
 * Better Auth automatically chunks cookies if they exceed 4KB.
 */
export function createAuth(env: Env) {
  return betterAuth({
    // No database = automatic stateless mode
    // Session is stored in encrypted JWE cookie
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: env.BETTER_AUTH_URL ? [env.BETTER_AUTH_URL] : [],

    // Cloudflare KV secondary storage for session caching and rate limiting
    secondaryStorage: createKVSecondaryStorage(env.AUTH_KV),

    socialProviders: {
      discord: {
        clientId: env.DISCORD_CLIENT_ID,
        clientSecret: env.DISCORD_CLIENT_SECRET,
        // Request guilds scope to fetch user's servers
        scope: ["identify", "email", "guilds", "guilds.members.read"],
      },
    },

    session: {
      cookieCache: {
        enabled: true,
        maxAge: 7 * 24 * 60 * 60, // 7 days
        strategy: "jwe", // Encrypted JWT
        refreshCache: false, // secondaryStorage handles caching; refreshCache is for DB-less setups
      },
    },

    account: {
      // Store OAuth state in cookie (required for stateless)
      storeStateStrategy: "cookie",
      // Store account data (access token, etc.) in cookie after OAuth flow
      storeAccountCookie: true,
    },

    // Rate limiting using KV secondary storage
    // Note: KV minimum TTL is 60 seconds, so window must be >= 60
    rateLimit: {
      enabled: true,
      storage: "secondary-storage",
      window: 60, // 60 seconds (KV minimum TTL)
      max: 100, // 100 requests per window
      customRules: {
        // Stricter limits for auth endpoints
        "/sign-in/social": {
          window: 60,
          max: 10, // 10 sign-in attempts per minute
        },
      },
    },

    // TanStack Start cookie plugin must be LAST
    plugins: [tanstackStartCookies()],
  });
}

export type Auth = ReturnType<typeof createAuth>;
