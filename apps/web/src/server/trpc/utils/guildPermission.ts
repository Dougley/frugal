/**
 * Guild permission validation utilities for TRPC procedures
 *
 * Provides reusable functions to validate that a user has ManageEvents
 * permission for a Discord guild. Used across giveaway-related procedures.
 */

import { TRPCError } from "@trpc/server";
import type { RESTAPIPartialCurrentUserGuild } from "discord-api-types/v10";
import { PermissionFlagsBits } from "discord-api-types/v10";
import { BitField } from "discord-bitflag";

import { createAuth } from "~/server/auth";
import { getCachedDiscordGuilds, getGuildIconUrl } from "~/server/auth/discord";
import type { TRPCContext } from "../context";

/**
 * Context type after protectedProcedure middleware
 * (session and user are guaranteed non-null)
 */
type ProtectedContext = TRPCContext & {
  session: NonNullable<TRPCContext["session"]>;
  user: NonNullable<TRPCContext["user"]>;
};

/**
 * Guild with resolved icon URL
 */
export type GuildWithIcon = RESTAPIPartialCurrentUserGuild & {
  iconUrl: string | null;
};

/**
 * Result of successful guild permission validation
 */
export type ValidatedGuild = {
  guild: GuildWithIcon;
  guilds: RESTAPIPartialCurrentUserGuild[];
};

/**
 * Get Discord access token for the current user
 *
 * @throws TRPCError with UNAUTHORIZED if token cannot be retrieved
 */
export async function getDiscordAccessToken(
  ctx: ProtectedContext
): Promise<string> {
  const auth = createAuth(ctx.env);
  const tokenResponse = await auth.api.getAccessToken({
    body: { providerId: "discord" },
    headers: ctx.headers,
  });

  if (!tokenResponse?.accessToken) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Failed to get Discord access token",
    });
  }

  return tokenResponse.accessToken;
}

/**
 * Get cached Discord guilds for the current user
 *
 * @throws TRPCError with INTERNAL_SERVER_ERROR if guilds cannot be fetched
 */
export async function getGuildsForUser(
  ctx: ProtectedContext,
  accessToken: string
): Promise<RESTAPIPartialCurrentUserGuild[]> {
  const guilds = await getCachedDiscordGuilds(
    ctx.env.AUTH_KV,
    accessToken,
    ctx.session.token
  );

  if (!guilds) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch Discord guilds",
    });
  }

  return guilds;
}

/**
 * Check if user has ManageEvents permission for a guild
 */
export function hasManageEventsPermission(
  guild: RESTAPIPartialCurrentUserGuild
): boolean {
  return new BitField(BigInt(guild.permissions)).has(
    PermissionFlagsBits.ManageEvents
  );
}

/**
 * Filter guilds to only those where user has ManageEvents permission
 */
export function filterGuildsWithPermission(
  guilds: RESTAPIPartialCurrentUserGuild[]
): RESTAPIPartialCurrentUserGuild[] {
  return guilds.filter(hasManageEventsPermission);
}

/**
 * Validate that user has ManageEvents permission for a specific guild
 *
 * This is the main utility for procedures that operate on a specific guild.
 * It handles the complete flow:
 * 1. Get Discord access token from Better Auth
 * 2. Fetch user's guilds from Discord API (cached in KV)
 * 3. Find the requested guild
 * 4. Verify ManageEvents permission
 *
 * @param ctx - Protected TRPC context (session/user guaranteed)
 * @param guildId - Discord guild ID to validate
 * @param errorContext - Custom error message context (e.g., "view this giveaway")
 *
 * @returns The validated guild with icon URL and full guilds list
 * @throws TRPCError with appropriate code if validation fails
 */
export async function validateGuildPermission(
  ctx: ProtectedContext,
  guildId: string,
  errorContext: string = "access this resource"
): Promise<ValidatedGuild> {
  // Step 1: Get Discord access token
  const accessToken = await getDiscordAccessToken(ctx);

  // Step 2: Fetch guilds from Discord API (cached in KV)
  const guilds = await getGuildsForUser(ctx, accessToken);

  // Step 3: Find the requested guild
  const guild = guilds.find((g) => g.id === guildId);

  if (!guild) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Guild not found or you don't have access to it",
    });
  }

  // Step 4: Check ManageEvents permission
  if (!hasManageEventsPermission(guild)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `You don't have permission to ${errorContext}`,
    });
  }

  return {
    guild: {
      ...guild,
      iconUrl: getGuildIconUrl(guild),
    },
    guilds,
  };
}

/**
 * Get guilds where user has ManageEvents permission
 *
 * Utility for procedures that need to list manageable guilds.
 * Handles the complete flow:
 * 1. Get Discord access token from Better Auth
 * 2. Fetch user's guilds from Discord API (cached in KV)
 * 3. Filter to only guilds with ManageEvents permission
 *
 * @param ctx - Protected TRPC context (session/user guaranteed)
 * @returns List of guilds with ManageEvents permission and icon URLs
 */
export async function getManageableGuilds(
  ctx: ProtectedContext
): Promise<GuildWithIcon[]> {
  const accessToken = await getDiscordAccessToken(ctx);
  const guilds = await getGuildsForUser(ctx, accessToken);
  const eligibleGuilds = filterGuildsWithPermission(guilds);

  return eligibleGuilds.map((guild) => ({
    ...guild,
    iconUrl: getGuildIconUrl(guild),
  }));
}
