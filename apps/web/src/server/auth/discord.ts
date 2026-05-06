/**
 * Discord API utilities for fetching user data using OAuth access tokens
 *
 * Note: Access tokens are NOT stored in cookies. Use authClient.getAccessToken()
 * to get a fresh token when needed (auto-refreshes if expired).
 *
 * Caching Strategy:
 * - Discord user and guild data is cached in Cloudflare KV for the session duration
 * - Cache key is based on session token, so signing out invalidates the cache
 * - TTL matches session expiry (7 days) to ensure stale data is cleaned up
 */

import {
  type APIUser,
  CDNRoutes,
  ImageFormat,
  type RESTAPIPartialCurrentUserGuild,
  type RESTGetAPICurrentUserGuildsResult,
  type RESTGetAPICurrentUserResult,
} from "discord-api-types/v10";
import { z } from "zod";

const DISCORD_API_BASE = "https://discord.com/api/v10";
const DISCORD_CDN_BASE = "https://cdn.discordapp.com";

/** Cache TTL for Discord data: 7 days (matches session expiry) */
const DISCORD_CACHE_TTL = 7 * 24 * 60 * 60;

/**
 * Minimal Zod schemas for Discord API responses
 * Only validates the fields we actually use - Discord may add new fields anytime
 */
const discordUserSchema = z
  .object({
    id: z.string(),
    username: z.string(),
    discriminator: z.string(),
    avatar: z.string().nullable(),
  })
  .passthrough();

const discordGuildSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    icon: z.string().nullable(),
  })
  .passthrough();

const discordGuildsArraySchema = z.array(discordGuildSchema);

/**
 * Fetch the user's Discord guilds (servers)
 * Requires the "guilds" scope in OAuth
 */
export async function getDiscordGuilds(
  accessToken: string
): Promise<RESTGetAPICurrentUserGuildsResult> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Failed to fetch Discord guilds: ${response.status} ${error}`
    );
  }

  const data = await response.json();
  const parsed = discordGuildsArraySchema.safeParse(data);
  if (!parsed.success) {
    console.error("[Discord] Invalid guilds response:", parsed.error);
    throw new Error("Invalid Discord guilds response format");
  }

  return data as RESTGetAPICurrentUserGuildsResult;
}

/**
 * Fetch the current Discord user
 * Requires the "identify" scope in OAuth
 */
export async function getDiscordUser(
  accessToken: string
): Promise<RESTGetAPICurrentUserResult> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Failed to fetch Discord user: ${response.status} ${error}`
    );
  }

  const data = await response.json();
  const parsed = discordUserSchema.safeParse(data);
  if (!parsed.success) {
    console.error("[Discord] Invalid user response:", parsed.error);
    throw new Error("Invalid Discord user response format");
  }

  return data as RESTGetAPICurrentUserResult;
}

/**
 * Generate Discord avatar URL for a user
 * @see https://discord.com/developers/docs/reference#image-formatting-cdn-endpoints
 */
export function getUserAvatarUrl(
  user: Pick<APIUser, "id" | "avatar" | "discriminator">,
  size: number = 128
): string {
  if (user.avatar) {
    const format = user.avatar.startsWith("a_")
      ? ImageFormat.GIF
      : ImageFormat.PNG;
    return `${DISCORD_CDN_BASE}${CDNRoutes.userAvatar(user.id, user.avatar, format)}?size=${size}`;
  }

  // Default avatar based on discriminator or user ID
  const index =
    user.discriminator && user.discriminator !== "0"
      ? Number.parseInt(user.discriminator, 10) % 5
      : Number((BigInt(user.id) >> BigInt(22)) % BigInt(6));

  return `${DISCORD_CDN_BASE}${CDNRoutes.defaultUserAvatar(index as 0 | 1 | 2 | 3 | 4 | 5)}`;
}

/**
 * Generate Discord guild icon URL
 * @see https://discord.com/developers/docs/reference#image-formatting-cdn-endpoints
 */
export function getGuildIconUrl(
  guild: Pick<RESTAPIPartialCurrentUserGuild, "id" | "icon">,
  size: number = 128
): string | null {
  if (!guild.icon) return null;

  const format = guild.icon.startsWith("a_")
    ? ImageFormat.GIF
    : ImageFormat.PNG;
  return `${DISCORD_CDN_BASE}${CDNRoutes.guildIcon(guild.id, guild.icon, format)}?size=${size}`;
}

/**
 * Get Discord user data with KV caching
 *
 * Caches user data for 7 days to avoid hitting Discord API on every request.
 * Users can re-login to refresh their cached data if needed.
 *
 * @param kv - Cloudflare KV namespace for caching
 * @param accessToken - OAuth access token for Discord API
 * @param sessionToken - Session token used as cache key (ensures cache invalidation on logout)
 */
export async function getCachedDiscordUser(
  kv: KVNamespace,
  accessToken: string,
  sessionToken: string
): Promise<APIUser | null> {
  const cacheKey = `discord-user:${sessionToken}`;

  // Try to get from cache first
  const cached = await kv.get(cacheKey, "json");
  if (cached) {
    const parsed = discordUserSchema.safeParse(cached);
    if (parsed.success) {
      return cached as APIUser;
    }
    // Invalid cached data - delete and refetch
    console.warn("[Discord] Invalid cached user data, refetching");
    await kv.delete(cacheKey);
  }

  // Fetch from Discord API
  let discordUser: APIUser;
  try {
    discordUser = await getDiscordUser(accessToken);
  } catch (error) {
    console.error("[Discord] Failed to fetch user:", error);
    return null;
  }

  // Cache for session duration
  await kv.put(cacheKey, JSON.stringify(discordUser), {
    expirationTtl: DISCORD_CACHE_TTL,
  });

  return discordUser;
}

/**
 * Get Discord guilds with KV caching
 *
 * Caches guild data for 7 days to avoid hitting Discord API on every request.
 * Users can re-login to refresh their cached data if needed.
 *
 * @param kv - Cloudflare KV namespace for caching
 * @param accessToken - OAuth access token for Discord API
 * @param sessionToken - Session token used as cache key (ensures cache invalidation on logout)
 */
export async function getCachedDiscordGuilds(
  kv: KVNamespace,
  accessToken: string,
  sessionToken: string
): Promise<RESTGetAPICurrentUserGuildsResult | null> {
  const cacheKey = `discord-guilds:${sessionToken}`;

  // Try to get from cache first
  const cached = await kv.get(cacheKey, "json");
  if (cached) {
    const parsed = discordGuildsArraySchema.safeParse(cached);
    if (parsed.success) {
      return cached as RESTGetAPICurrentUserGuildsResult;
    }
    // Invalid cached data - delete and refetch
    console.warn("[Discord] Invalid cached guilds data, refetching");
    await kv.delete(cacheKey);
  }

  // Fetch from Discord API
  let guilds: RESTGetAPICurrentUserGuildsResult;
  try {
    guilds = await getDiscordGuilds(accessToken);
  } catch (error) {
    console.error("[Discord] Failed to fetch guilds:", error);
    return null;
  }

  // Cache for session duration
  await kv.put(cacheKey, JSON.stringify(guilds), {
    expirationTtl: DISCORD_CACHE_TTL,
  });

  return guilds;
}

/** Cache TTL for guild command perms and member roles: 5 minutes */
const CMD_PERMS_TTL = 300;

/** Cache TTL for guild channels and roles: 1 hour */
const GUILD_RESOURCES_TTL = 3600;

export type GuildCommandPerms = {
  id: string;
  name: string;
  application_id: string;
  guild_id: string;
  permissions: { id: string; type: 1 | 2 | 3; permission: boolean }[];
};

export type GuildMember = { roles: string[] };

/**
 * Fetch per-guild command permission overrides using the bot token.
 * Cached for 60s per guild (shared across all users in the guild).
 */
export async function getCachedGuildCommandPerms(
  kv: KVNamespace,
  botToken: string,
  applicationId: string,
  guildId: string
): Promise<GuildCommandPerms[]> {
  const cacheKey = `discord:gcp:${guildId}`;
  const cached = await kv.get(cacheKey, "json");
  if (cached) return cached as GuildCommandPerms[];

  const auth = { Authorization: `Bot ${botToken}` };
  const [commandsRes, permsRes] = await Promise.all([
    fetch(`${DISCORD_API_BASE}/applications/${applicationId}/commands`, {
      headers: auth,
    }),
    fetch(
      `${DISCORD_API_BASE}/applications/${applicationId}/guilds/${guildId}/commands/permissions`,
      { headers: auth }
    ),
  ]);

  const globalCommands: { id: string; name: string }[] = commandsRes.ok
    ? ((await commandsRes.json()) as { id: string; name: string }[])
    : [];

  if (permsRes.status === 404) return [];
  if (!permsRes.ok) {
    console.error(
      `[Discord] Failed to fetch guild command perms: ${permsRes.status}`
    );
    return [];
  }

  const rawPerms = (await permsRes.json()) as Omit<GuildCommandPerms, "name">[];
  const idToName = new Map(globalCommands.map((c) => [c.id, c.name]));
  const perms: GuildCommandPerms[] = [];
  for (const p of rawPerms) {
    const name = idToName.get(p.id);
    // Skip entries where we cannot resolve the command name — these are
    // guild-specific commands (not in the global list) and we cannot
    // meaningfully match them against our action map.
    if (!name) continue;
    perms.push({ ...p, name });
  }

  await kv.put(cacheKey, JSON.stringify(perms), {
    expirationTtl: CMD_PERMS_TTL,
  });
  return perms;
}

/**
 * Fetch the calling user's member info (roles) for a guild.
 * Requires the `guilds.members.read` OAuth scope. Returns null on 401/403 (scope missing).
 * Cached for 60s per user+guild.
 */
export async function getCachedGuildMember(
  kv: KVNamespace,
  accessToken: string,
  sessionToken: string,
  guildId: string
): Promise<GuildMember | null> {
  const cacheKey = `discord:member:${sessionToken}:${guildId}`;
  const cached = await kv.get(cacheKey, "json");
  if (cached) return cached as GuildMember;

  const response = await fetch(
    `${DISCORD_API_BASE}/users/@me/guilds/${guildId}/member`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) {
    console.error(`[Discord] Guild member fetch failed: ${response.status}`);
    return null;
  }

  const data = (await response.json()) as { roles?: string[] };
  const member: GuildMember = { roles: data.roles ?? [] };
  await kv.put(cacheKey, JSON.stringify(member), {
    expirationTtl: CMD_PERMS_TTL,
  });
  return member;
}

export type GuildChannel = { id: string; name: string };
export type GuildRole = { id: string; name: string };
export type GuildResources = {
  channels: GuildChannel[];
  roles: GuildRole[];
  botNotInGuild: boolean;
};

/**
 * Fetch text channels and roles for a guild using the bot token.
 * Returns botNotInGuild: true when the bot has been removed from the guild (403/404).
 * Cached for 1 hour per guild.
 */
export async function getCachedGuildResources(
  kv: KVNamespace,
  botToken: string,
  guildId: string
): Promise<GuildResources> {
  const cacheKey = `discord:resources:${guildId}`;
  const cached = await kv.get(cacheKey, "json");
  if (cached) return cached as GuildResources;

  const auth = { Authorization: `Bot ${botToken}` };

  const [channelsRes, rolesRes] = await Promise.all([
    fetch(`${DISCORD_API_BASE}/guilds/${guildId}/channels`, { headers: auth }),
    fetch(`${DISCORD_API_BASE}/guilds/${guildId}/roles`, { headers: auth }),
  ]);

  if (channelsRes.status === 403 || channelsRes.status === 404) {
    return { channels: [], roles: [], botNotInGuild: true };
  }

  const channels: GuildChannel[] = channelsRes.ok
    ? (
        (await channelsRes.json()) as {
          id: string;
          name: string;
          type: number;
        }[]
      )
        .filter((c) => c.type === 0 || c.type === 5)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(({ id, name }) => ({ id, name }))
    : [];

  const roles: GuildRole[] = rolesRes.ok
    ? (
        (await rolesRes.json()) as {
          id: string;
          name: string;
          managed: boolean;
        }[]
      )
        .filter((r) => !r.managed && r.id !== guildId)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(({ id, name }) => ({ id, name }))
    : [];

  const result: GuildResources = { channels, roles, botNotInGuild: false };
  await kv.put(cacheKey, JSON.stringify(result), {
    expirationTtl: GUILD_RESOURCES_TTL,
  });
  return result;
}
