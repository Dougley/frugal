import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import type { RESTAPIPartialCurrentUserGuild } from "discord-api-types/v10";

import { createAuth } from "~/server/auth";
import { getCachedDiscordGuilds, getGuildIconUrl } from "~/server/auth/discord";
import { protectedProcedure } from "../instance";

/**
 * Auth router - handles Discord API data fetching
 *
 * Note: Session fetching is handled by getSessionFn (createServerFn) in beforeLoad.
 * This router only contains procedures that need to be called client-side.
 */
export const authRouter = {
  /**
   * Get current user's Discord guilds (protected)
   *
   * Requires authentication. Fetches guilds using OAuth access token.
   * Results are cached in KV for session duration.
   */
  getGuilds: protectedProcedure.query(async ({ ctx }) => {
    // Get access token from Better Auth
    const auth = createAuth(ctx.env);
    const tokenResponse = await auth.api.getAccessToken({
      body: {
        providerId: "discord",
      },
      headers: ctx.headers,
    });

    if (!tokenResponse?.accessToken) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get Discord access token",
      });
    }

    // Fetch guilds from Discord API (cached in KV)
    const guilds = await getCachedDiscordGuilds(
      ctx.env.AUTH_KV,
      tokenResponse.accessToken,
      ctx.session.token
    );

    if (!guilds) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch Discord guilds",
      });
    }

    // Add icon URLs and return
    return guilds.map(
      (guild): RESTAPIPartialCurrentUserGuild & { iconUrl: string | null } => ({
        ...guild,
        iconUrl: getGuildIconUrl(guild),
      })
    );
  }),
} satisfies TRPCRouterRecord;
