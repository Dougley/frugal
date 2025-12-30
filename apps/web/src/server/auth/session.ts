/**
 * Server-side session management using TanStack Start's createServerFn
 *
 * This module provides SSR-compatible session fetching with Discord user data.
 * Uses createServerFn for direct access to request headers (no cookie forwarding issues).
 *
 * Usage:
 * - In beforeLoad: `const session = await getSessionFn()`
 * - In components: Use the session from route context or AuthContext
 */

import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { getCachedDiscordUser, getUserAvatarUrl } from "./discord";
import { createAuth } from "./index";

/**
 * User data returned by getSessionFn
 * Transformed from Discord API data with computed fields
 */
export interface SessionUser {
  id: string;
  username: string;
  globalName: string | null;
  email: string;
  avatarUrl: string;
}

/**
 * Session data returned from getSessionFn
 */
export interface SessionData {
  session: {
    token: string;
    expiresAt: Date;
  };
  user: SessionUser;
}

/**
 * Server function to get the current session with Discord user data
 *
 * This is the primary way to fetch auth data during SSR.
 * Uses createServerFn for direct access to request headers.
 *
 * Returns null if not authenticated.
 *
 * @example
 * ```tsx
 * // In __root.tsx beforeLoad
 * beforeLoad: async () => {
 *   const session = await getSessionFn();
 *   return { session };
 * }
 * ```
 */
export const getSessionFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<SessionData | null> => {
    const headers = new Headers(getRequestHeaders());

    // Get session from Better Auth
    const auth = createAuth(env);
    const sessionData = await auth.api.getSession({
      headers,
      query: {
        disableCookieCache: false, // Use cache for performance
      },
    });

    if (!sessionData?.session || !sessionData?.user) {
      return null;
    }

    // Get access token for Discord API calls
    const tokenResponse = await auth.api.getAccessToken({
      body: {
        providerId: "discord",
      },
      headers,
    });

    if (!tokenResponse?.accessToken) {
      console.error("[Session] No access token available");
      return null;
    }

    // Fetch Discord user data (cached in KV)
    const discordUser = await getCachedDiscordUser(
      env.AUTH_KV,
      tokenResponse.accessToken,
      sessionData.session.token
    );

    if (!discordUser) {
      console.error("[Session] Failed to get Discord user data");
      return null;
    }

    return {
      session: {
        token: sessionData.session.token,
        expiresAt: sessionData.session.expiresAt,
      },
      user: {
        id: discordUser.id,
        username: discordUser.username,
        globalName: discordUser.global_name,
        email: sessionData.user.email,
        avatarUrl: getUserAvatarUrl(discordUser),
      },
    };
  }
);
