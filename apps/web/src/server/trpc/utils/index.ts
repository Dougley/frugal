/**
 * TRPC utility exports
 *
 * Shared utilities for TRPC procedures including:
 * - Guild permission validation
 * - Durable Object client creation
 * - Summary caching
 */

export {
  createDOClient,
  createNewDOClient,
  type DOClient,
} from "./durableObject";

export {
  filterGuildsWithPermission,
  type GuildWithIcon,
  getDiscordAccessToken,
  getGuildsForUser,
  getManageableGuilds,
  hasManageEventsPermission,
  type ValidatedGuild,
  validateGuildPermission,
} from "./guildPermission";

export {
  fetchSummaryFromStorage,
  paginateEntries,
  type SummaryFetchResult,
} from "./summaryCache";
