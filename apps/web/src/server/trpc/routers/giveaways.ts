/// <reference types="@dougley/types/summaries" />

import { count, eq, inArray, sql } from "@dougley/frugal-drizzle/workers";
import * as Schema from "@dougley/frugal-drizzle/workers/schema.js";
import { getPremiumStatus } from "@dougley/frugal-subscriptions";
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure } from "../instance";
import {
  createDOClient,
  fetchSummaryFromStorage,
  getManageableGuilds,
  paginateEntries,
  validateGuildPermission,
} from "../utils";

/**
 * Giveaways router - handles giveaway data fetching
 *
 * All procedures require authentication and proper Discord permissions.
 */
export const giveawaysRouter = {
  /**
   * Get details for a specific giveaway
   *
   * Returns giveaway metadata from D1. Validates that the user
   * has ManageEvents permission for the guild.
   */
  getDetails: protectedProcedure
    .input(
      z.object({
        giveawayId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get giveaway metadata from D1
      const giveaway = await ctx.db.query.giveaways.findFirst({
        where: eq(Schema.giveaways.durableObjectId, input.giveawayId),
      });

      if (!giveaway) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Giveaway not found",
        });
      }

      // Validate guild permission
      const { guild } = await validateGuildPermission(
        ctx,
        giveaway.guildId,
        "view this giveaway"
      );

      const subscription = await getPremiumStatus(
        {
          userId: ctx.user.id,
          guildId: giveaway.guildId,
        },
        ctx.db
      );

      // Keep non-closed giveaways visible in lists for upsell,
      // but gate the detail view (and live participant list) behind premium.
      if (!subscription.hasPremium && giveaway.state !== "CLOSED") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "402 PREMIUM_REQUIRED",
        });
      }

      return {
        giveaway,
        guild,
      };
    }),

  /**
   * Get paginated guilds with active/closed giveaways that the user can manage
   *
   * Filters guilds to only those where user has ManageEvents permission
   * and that have at least one giveaway.
   *
   * Uses database-level aggregation for efficiency instead of fetching all giveaways.
   */
  getGuildsWithGiveaways: protectedProcedure
    .input(
      z
        .object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(25),
        })
        .default({ page: 1, limit: 25 })
    )
    .query(async ({ ctx, input }) => {
      // Get guilds where user has ManageEvents permission
      const eligibleGuilds = await getManageableGuilds(ctx);
      const eligibleGuildIds = eligibleGuilds.map((guild) => guild.id);

      if (eligibleGuildIds.length === 0) {
        return {
          guilds: [],
          pagination: {
            page: input.page,
            limit: input.limit,
            total: 0,
            hasMore: false,
          },
        };
      }

      // Use database aggregation to get giveaway counts per guild
      const giveawayCounts = await ctx.db
        .select({
          guildId: Schema.giveaways.guildId,
          giveawayCount: count(),
          activeCount:
            sql<number>`SUM(CASE WHEN ${Schema.giveaways.state} != 'CLOSED' THEN 1 ELSE 0 END)`.as(
              "active_count"
            ),
        })
        .from(Schema.giveaways)
        .where(inArray(Schema.giveaways.guildId, eligibleGuildIds))
        .groupBy(Schema.giveaways.guildId);

      // Create a map for O(1) lookup
      const countsByGuildId = new Map(
        giveawayCounts.map((row) => [
          row.guildId,
          { giveawayCount: row.giveawayCount, activeCount: row.activeCount },
        ])
      );

      // Filter guilds to only those that have giveaways
      const guildsWithGiveaways = eligibleGuilds.filter((guild) =>
        countsByGuildId.has(guild.id)
      );

      const { page, limit } = input;
      const total = guildsWithGiveaways.length;

      // Calculate pagination
      const startIndex = (page - 1) * limit;
      const endIndex = Math.min(startIndex + limit, total);
      const paginatedGuilds = guildsWithGiveaways.slice(startIndex, endIndex);

      // Add giveaway counts (iconUrl already added by getManageableGuilds)
      const guildsWithMetadata = paginatedGuilds.map((guild) => {
        const counts = countsByGuildId.get(guild.id) ?? {
          giveawayCount: 0,
          activeCount: 0,
        };
        return {
          ...guild,
          giveawayCount: counts.giveawayCount,
          activeCount: counts.activeCount,
        };
      });

      return {
        guilds: guildsWithMetadata,
        pagination: {
          page,
          limit,
          total,
          hasMore: endIndex < total,
        },
      };
    }),

  /**
   * Get paginated giveaways hosted by the current user across all guilds
   *
   * Uses database-level pagination for efficiency.
   */
  getHostedGiveaways: protectedProcedure
    .input(
      z
        .object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(25),
        })
        .default({ page: 1, limit: 25 })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit } = input;
      const offset = (page - 1) * limit;

      // Use Promise.all to run count and data queries in parallel
      const [totalResult, paginatedGiveaways] = await Promise.all([
        ctx.db
          .select({ count: count() })
          .from(Schema.giveaways)
          .where(eq(Schema.giveaways.hostId, ctx.user.id)),
        ctx.db.query.giveaways.findMany({
          where: eq(Schema.giveaways.hostId, ctx.user.id),
          orderBy: (giveaways, { desc }) => [desc(giveaways.endTime)],
          limit,
          offset,
        }),
      ]);

      const total = totalResult[0]?.count ?? 0;

      return {
        giveaways: paginatedGiveaways,
        pagination: {
          page,
          limit,
          total,
          hasMore: offset + paginatedGiveaways.length < total,
        },
      };
    }),

  /**
   * Get paginated giveaways for a specific guild
   *
   * Validates that the user has ManageEvents permission for the guild.
   * Returns giveaways with pagination metadata.
   *
   * Uses database-level pagination and COUNT for efficiency.
   */
  getGuildGiveaways: protectedProcedure
    .input(
      z.object({
        guildId: z.string(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(25),
      })
    )
    .query(async ({ ctx, input }) => {
      // Validate guild permission
      const { guild } = await validateGuildPermission(
        ctx,
        input.guildId,
        "view this guild's giveaways"
      );

      const { page, limit } = input;
      const offset = (page - 1) * limit;

      // Run all queries in parallel for efficiency
      const [countsResult, paginatedGiveaways] = await Promise.all([
        // Get counts using database aggregation
        ctx.db
          .select({
            total: count(),
            activeCount:
              sql<number>`SUM(CASE WHEN ${Schema.giveaways.state} != 'CLOSED' THEN 1 ELSE 0 END)`.as(
                "active_count"
              ),
            closedCount:
              sql<number>`SUM(CASE WHEN ${Schema.giveaways.state} = 'CLOSED' THEN 1 ELSE 0 END)`.as(
                "closed_count"
              ),
          })
          .from(Schema.giveaways)
          .where(eq(Schema.giveaways.guildId, input.guildId)),
        // Get paginated giveaways
        ctx.db.query.giveaways.findMany({
          where: eq(Schema.giveaways.guildId, input.guildId),
          orderBy: (giveaways, { desc }) => [desc(giveaways.endTime)],
          limit,
          offset,
        }),
      ]);

      const total = countsResult[0]?.total ?? 0;
      const activeCount = countsResult[0]?.activeCount ?? 0;
      const closedCount = countsResult[0]?.closedCount ?? 0;

      return {
        guild,
        giveaways: paginatedGiveaways,
        pagination: {
          page,
          limit,
          total,
          hasMore: offset + paginatedGiveaways.length < total,
        },
        counts: {
          total,
          active: activeCount,
          closed: closedCount,
        },
      };
    }),

  /**
   * Get giveaway summary from R2 storage
   *
   * Fetches closed giveaway summary with caching via Cloudflare cache.
   * Summaries are immutable once created, so they can be cached for 3 months.
   *
   * Returns paginated entries - first page is SSR'd, subsequent pages fetched client-side.
   */
  getSummary: protectedProcedure
    .input(
      z.object({
        summaryId: z.string(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(25),
      })
    )
    .query(async ({ input }) => {
      const { env } = await import("cloudflare:workers");
      const { summaryId: id, page, limit } = input;

      // Fetch summary from R2 with caching
      const { summary, etag } = await fetchSummaryFromStorage(env.STORAGE, id);

      // Paginate entries
      const { items: entries, pagination } = paginateEntries(
        summary.entries ?? [],
        page,
        limit
      );

      return {
        details: summary.details,
        entries,
        pagination,
        etag,
      };
    }),

  /**
   * Download full giveaway summary from R2 storage
   *
   * Returns the complete summary with all entries for downloading.
   * Uses the same caching as getSummary.
   */
  downloadSummary: protectedProcedure
    .input(
      z.object({
        summaryId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { env } = await import("cloudflare:workers");

      // Fetch summary from R2 with caching
      const { summary } = await fetchSummaryFromStorage(
        env.STORAGE,
        input.summaryId
      );

      return { summary };
    }),

  /**
   * Update a giveaway's prize, winners count, or description
   *
   * Validates that the user has ManageEvents permission and the giveaway is OPEN.
   * Proxies to the Durable Object which handles the update and Discord message edit.
   */
  updateGiveaway: protectedProcedure
    .input(
      z.object({
        giveawayId: z.string(),
        prize: z.string().min(1).max(100),
        winners: z.number().min(1).max(50),
        description: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { giveawayId, prize, winners, description } = input;

      // Validate permission
      const giveaway = await ctx.db.query.giveaways.findFirst({
        where: eq(Schema.giveaways.durableObjectId, giveawayId),
      });

      if (!giveaway) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Giveaway not found",
        });
      }

      // Validate guild permission
      await validateGuildPermission(
        ctx,
        giveaway.guildId,
        "edit this giveaway"
      );

      // Proxy to Durable Object
      const { env } = await import("cloudflare:workers");
      const doClient = createDOClient(env, giveawayId);

      const result = await doClient.updateGiveaway.mutate({
        prize,
        winners,
        description,
      });

      return result;
    }),

  /**
   * Stop a giveaway early
   *
   * Validates that the user has ManageEvents permission and the giveaway is OPEN.
   * Proxies to the Durable Object which triggers the alarm to end immediately.
   */
  stopGiveaway: protectedProcedure
    .input(
      z.object({
        giveawayId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { giveawayId } = input;

      // Validate permission
      const giveaway = await ctx.db.query.giveaways.findFirst({
        where: eq(Schema.giveaways.durableObjectId, giveawayId),
      });

      if (!giveaway) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Giveaway not found",
        });
      }

      // Validate guild permission
      await validateGuildPermission(
        ctx,
        giveaway.guildId,
        "stop this giveaway"
      );

      // Proxy to Durable Object
      const { env } = await import("cloudflare:workers");
      const doClient = createDOClient(env, giveawayId);

      const result = await doClient.endGiveaway.mutate();

      return result;
    }),

  /**
   * Reroll winners for a closed giveaway
   *
   * Validates that the user has ManageEvents permission and the giveaway is CLOSED.
   * Proxies to the Durable Object which selects new random winners.
   */
  getRerollConfig: protectedProcedure
    .input(
      z.object({
        giveawayId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const giveaway = await ctx.db.query.giveaways.findFirst({
        where: eq(Schema.giveaways.durableObjectId, input.giveawayId),
      });

      if (!giveaway) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Giveaway not found",
        });
      }

      await validateGuildPermission(
        ctx,
        giveaway.guildId,
        "reroll this giveaway"
      );

      const subscription = await getPremiumStatus(
        {
          userId: ctx.user.id,
          guildId: giveaway.guildId,
        },
        ctx.db
      );

      return {
        isPremium: subscription.hasPremium,
        maxRerollCount: subscription.hasPremium ? 50 : 1,
      };
    }),

  rerollWinners: protectedProcedure
    .input(
      z.object({
        giveawayId: z.string(),
        count: z.number().min(1).max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { giveawayId, count } = input;

      // Validate permission
      const giveaway = await ctx.db.query.giveaways.findFirst({
        where: eq(Schema.giveaways.durableObjectId, giveawayId),
      });

      if (!giveaway) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Giveaway not found",
        });
      }

      // Validate guild permission
      await validateGuildPermission(
        ctx,
        giveaway.guildId,
        "reroll this giveaway"
      );

      const subscription = await getPremiumStatus(
        {
          userId: ctx.user.id,
          guildId: giveaway.guildId,
        },
        ctx.db
      );

      // Keep parity with Discord:
      // - free users can only reroll a single winner at a time (and defaults to 1)
      // - premium users can reroll multiple (and defaults to all giveaway winners)
      const rerollCount =
        count ?? (subscription.hasPremium ? giveaway.winners : 1);

      if (!subscription.hasPremium && rerollCount > 1) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "402 PREMIUM_REQUIRED",
        });
      }

      // Proxy to Durable Object
      const { env } = await import("cloudflare:workers");
      const doClient = createDOClient(env, giveawayId);

      const result = await doClient.drawWinners.mutate(rerollCount);

      return result;
    }),

  /**
   * Get paginated participants for a giveaway
   *
   * For closed giveaways, fetches from R2 summary and paginates in-memory.
   * For active giveaways, participants are not available from the web dashboard
   * (they are stored in the Durable Object accessible only via the Discord worker).
   */
  getParticipants: protectedProcedure
    .input(
      z.object({
        giveawayId: z.string(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(25),
      })
    )
    .query(async ({ ctx, input }) => {
      const { giveawayId, page, limit } = input;

      // Get giveaway metadata from D1
      const giveaway = await ctx.db.query.giveaways.findFirst({
        where: eq(Schema.giveaways.durableObjectId, giveawayId),
      });

      if (!giveaway) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Giveaway not found",
        });
      }

      // Validate guild permission
      await validateGuildPermission(
        ctx,
        giveaway.guildId,
        "view this giveaway"
      );

      const subscription = await getPremiumStatus(
        {
          userId: ctx.user.id,
          guildId: giveaway.guildId,
        },
        ctx.db
      );

      // Keep non-closed giveaways visible in lists for upsell,
      // but gate live participant fetching behind premium.
      if (!subscription.hasPremium && giveaway.state !== "CLOSED") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "402 PREMIUM_REQUIRED",
        });
      }

      // For non-closed giveaways, fetch from Durable Object
      if (giveaway.state !== "CLOSED") {
        const { env } = await import("cloudflare:workers");
        const doClient = createDOClient(env, giveawayId);

        try {
          const result = await doClient.getEntriesPaginated.query({
            page,
            limit,
          });

          return {
            participants: result.entries.map((entry) => ({
              userId: entry.userId ?? "",
              username: entry.username ?? "",
              avatar: entry.avatar ?? null,
            })),
            total: result.total,
            page: result.page,
            limit: result.limit,
            hasMore: result.hasMore,
            isLive: true,
          };
        } catch (error) {
          console.error(
            "Failed to fetch participants from Durable Object:",
            error
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch live participant data",
            cause: error,
          });
        }
      }

      // For closed giveaways, fetch from R2 summary (uses caching)
      const { env } = await import("cloudflare:workers");

      try {
        const { summary } = await fetchSummaryFromStorage(
          env.STORAGE,
          giveawayId
        );

        // Paginate entries from summary
        const { items: paginatedParticipants, pagination } = paginateEntries(
          summary.entries ?? [],
          page,
          limit
        );

        return {
          participants: paginatedParticipants.map((entry) => ({
            userId: entry.id,
            username: entry.username,
            avatar: entry.avatar,
          })),
          total: pagination.total,
          page: pagination.page,
          limit: pagination.limit,
          hasMore: pagination.hasMore,
          isLive: false,
        };
      } catch (error) {
        // Summary not found - giveaway is closed but summary not yet generated
        if (error instanceof TRPCError && error.code === "NOT_FOUND") {
          return {
            participants: [],
            total: 0,
            page,
            limit,
            hasMore: false,
            isLive: false,
            message: "Summary is being generated. Please try again later.",
          };
        }
        throw error;
      }
    }),
} satisfies TRPCRouterRecord;
