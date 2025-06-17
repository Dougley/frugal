/// <reference types="@dougley/types/summaries" />
/// <reference types="@dougley/types/giveaway-types" />

import { DiscordApiClient } from "@discord-interactions/api";
import {
  drizzleDurable,
  Schema as DurableSchema,
} from "@dougley/frugal-drizzle/durables";
import {
  and,
  Schema as D1Schema,
  drizzleD1,
  eq,
  inArray,
  sql,
} from "@dougley/frugal-drizzle/workers";
import { createGiveawayComponents, JoinButton } from "@dougley/frugal-utils";
import { initTRPC, TRPCError } from "@trpc/server";
import { Routes } from "discord-api-types/v10";
import { z } from "zod";
import createRateLimitMiddleware from "./middleware";
import { transformer } from "./transformer";
import { type Context } from "./trpc";

// TRPC Setup
const t = initTRPC.context<Context<LegacyEnv>>().create({
  transformer,
});

const publicProcedure = t.procedure;
const router = t.router;

// Create specific rate limited procedures with preconfigured options
const entryRateLimit = createRateLimitMiddleware(t, {
  action: "join",
  cooldown: 5000,
});

const exitRateLimit = createRateLimitMiddleware(t, {
  action: "leave",
  cooldown: 5000,
});

// Utility functions
async function getGiveaway(ctx: Context<LegacyEnv>) {
  const db = drizzleD1(ctx.env.D1);
  const id = ctx.state.id.toString();

  const giveaway = await db
    .select()
    .from(D1Schema.giveaways)
    .where(eq(D1Schema.giveaways.durableObjectId, id))
    .get();

  if (!giveaway) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Giveaway not found",
    });
  }

  return giveaway;
}

/**
 * Functions for working with the local SQLite database
 */
const entriesDb = {
  /**
   * Get all entries for the current giveaway
   */
  getAll: (ctx: Context<LegacyEnv>) => {
    const db = drizzleDurable(ctx.state.storage);
    return db.select().from(DurableSchema.entries).all();
  },

  /**
   * Get a count of all entries
   */
  count: async (ctx: Context<LegacyEnv>) => {
    const db = drizzleDurable(ctx.state.storage);
    const result = db
      .select({ count: sql<number>`count(*)` })
      .from(DurableSchema.entries)
      .get();
    return result?.count ?? 0;
  },

  /**
   * Get a single entry by userId
   */
  getByUserId: (ctx: Context<LegacyEnv>, userId: string) => {
    const db = drizzleDurable(ctx.state.storage);
    return db
      .select()
      .from(DurableSchema.entries)
      .where(eq(DurableSchema.entries.userId, userId))
      .get();
  },

  /**
   * Add a new entry
   */
  create: (
    ctx: Context<LegacyEnv>,
    entry: { userId: string; username: string; avatar: string | null },
  ) => {
    const db = drizzleDurable(ctx.state.storage);
    return db
      .insert(DurableSchema.entries)
      .values({
        userId: entry.userId,
        username: entry.username,
        avatar: entry.avatar,
        winner: false,
        timestamp: new Date().toISOString(),
      })
      .run();
  },

  /**
   * Delete an entry by userId
   */
  delete: (ctx: Context<LegacyEnv>, userId: string) => {
    const db = drizzleDurable(ctx.state.storage);
    return db
      .delete(DurableSchema.entries)
      .where(eq(DurableSchema.entries.userId, userId))
      .run();
  },

  /**
   * Get random winners
   */
  getRandomWinners: (ctx: Context<LegacyEnv>, limit: number) => {
    const db = drizzleDurable(ctx.state.storage);
    return db
      .select()
      .from(DurableSchema.entries)
      .where(eq(DurableSchema.entries.winner, false))
      .orderBy(sql`RANDOM()`)
      .limit(limit)
      .all();
  },

  /**
   * Mark users as winners
   */
  markAsWinners: (ctx: Context<LegacyEnv>, userIds: string[]) => {
    if (userIds.length === 0) return;

    const db = drizzleDurable(ctx.state.storage);
    return db
      .update(DurableSchema.entries)
      .set({ winner: true })
      .where(inArray(DurableSchema.entries.userId, userIds))
      .run();
  },

  /**
   * Get all winners
   */
  getWinners: (ctx: Context<LegacyEnv>) => {
    const db = drizzleDurable(ctx.state.storage);
    return db
      .select()
      .from(DurableSchema.entries)
      .where(eq(DurableSchema.entries.winner, true))
      .all();
  },
};

/**
 * Validates that a giveaway is in the specified state
 */
const validateGiveawayState = (
  giveaway: { state: string },
  allowedStates: GiveawayState[],
) => {
  if (!allowedStates.includes(giveaway.state as GiveawayState)) {
    const stateMessage =
      allowedStates.length === 1
        ? `be in ${allowedStates[0]} state, but is currently ${giveaway.state}`
        : `be in one of the following states: ${allowedStates.join(", ")}. Currently ${giveaway.state}`;

    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `Giveaway must ${stateMessage}`,
    });
  }
};

export const stateRouter = router({
  getEntries: publicProcedure.query(async ({ ctx }) => {
    // Just use the local SQLite storage
    return entriesDb.getAll(ctx);
  }),

  startAlarm: publicProcedure
    .input(
      z
        .string()
        .datetime({ offset: true })
        .transform((value) => new Date(value))
        .refine((value) => value > new Date(), {
          message: "Date must be in the future",
        })
        .or(z.number().min(1).max(1)),
    )
    .mutation(async ({ input, ctx }) => {
      console.log("startAlarm", input);

      if (typeof input === "number" && input === 1) {
        return await ctx.state.storage.setAlarm(input);
      }

      const db = drizzleD1(ctx.env.D1);
      const id = ctx.state.id.toString();

      await db
        .update(D1Schema.giveaways)
        .set({ state: "OPEN" })
        .where(eq(D1Schema.giveaways.durableObjectId, id))
        .run();

      await ctx.state.storage.setAlarm(input);
      return { success: true };
    }),

  drawWinners: publicProcedure
    .input(z.number().optional())
    .mutation(async ({ input, ctx }) => {
      const giveaway = await getGiveaway(ctx);
      const numWinners = input ?? giveaway.winners;

      // Use local SQLite to get random winners
      const winners = entriesDb.getRandomWinners(ctx, numWinners);

      if (winners.length > 0) {
        // Mark selected users as winners
        const winnerIds = winners
          .map((winner) => winner.userId)
          .filter(Boolean) as string[];
        entriesDb.markAsWinners(ctx, winnerIds);
      }

      return {
        success: true,
        winners: winners.map(({ userId, username, avatar }) => ({
          id: userId,
          username,
          discriminator: "", // This field is no longer used by Discord
          avatar,
        })),
      };
    }),

  flush: publicProcedure
    .input(
      z
        .object({
          id: z.string().min(1),
          username: z.string().min(1),
          discriminator: z.string().min(1),
          avatar: z.string().nullable(),
        })
        .array(),
    )
    .mutation(async ({ input, ctx }) => {
      const giveaway = await getGiveaway(ctx);
      validateGiveawayState(giveaway, ["CLOSED"]);

      const id = ctx.state.id.toString();

      // Get entries from local SQLite database
      const entrants = entriesDb.getAll(ctx);

      const winners = input.map(({ id, ...rest }) => ({
        user_id: id,
        ...rest,
      }));

      const summary: SummaryOutput = {
        _version: 2,
        entries: entrants.map(({ userId, username, avatar }) => ({
          id: String(userId || ""),
          username: String(username || ""),
          discriminator: "", // This field is no longer used by Discord
          avatar: String(avatar || ""),
        })),
        details: {
          channel: giveaway.channelId,
          message: giveaway.messageId,
          winners: giveaway.winners,
          prize: giveaway.prize,
          originalWinners: winners.map((w) => w.user_id),
          time: {
            end: giveaway.endTime,
            start: giveaway.endTime,
          },
        },
      };

      const key = `giveaway-${id}.json`;
      await ctx.env.STORAGE.put(key, JSON.stringify(summary), {
        httpMetadata: {
          contentType: "application/json",
          cacheExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 3),
          cacheControl: "public, max-age=7776000",
        },
      });

      return { success: true, object: key };
    }),

  cleanup: publicProcedure.mutation(async ({ ctx }) => {
    const db = drizzleD1(ctx.env.D1);
    const _giveaway = await getGiveaway(ctx);
    const id = ctx.state.id.toString();

    // Delete from central database
    await db
      .delete(D1Schema.giveaways)
      .where(eq(D1Schema.giveaways.durableObjectId, id))
      .run();

    // This will delete all data in the durable object including the entries
    await ctx.state.storage.deleteAll();
    await ctx.state.storage.deleteAlarm();
    return { success: true };
  }),

  beginGiveaway: publicProcedure
    .input(
      z.object({
        message_id: z.string(),
        channel_id: z.string(),
        guild_id: z.string(),
        prize: z.string(),
        winners: z.number().min(1),
        end_time: z
          .string()
          .datetime()
          .transform((val) => new Date(val)),
        host_id: z.string(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = drizzleD1(ctx.env.D1);
      const id = ctx.state.id.toString();

      const giveaway = await db
        .insert(D1Schema.giveaways)
        .values({
          messageId: input.message_id,
          channelId: input.channel_id,
          guildId: input.guild_id,
          prize: input.prize,
          winners: input.winners,
          endTime: input.end_time.toISOString(),
          hostId: input.host_id,
          description: input.description,
          durableObjectId: id,
          state: "NEW",
          entryCount: 0,
        })
        .returning()
        .get();

      return {
        success: true,
        giveaway: {
          ...giveaway,
          end_time: giveaway.endTime,
        },
      };
    }),

  updateGiveaway: publicProcedure
    .input(
      z.object({
        prize: z.string().min(1).max(100),
        winners: z.number().min(1).max(50),
        description: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = drizzleD1(ctx.env.D1);
      const client = new DiscordApiClient({
        userAgent:
          "DiscordBot (@giveawaybot/timer, v1; +https://github.com/dougley/frugal)",
      });
      client.setToken(ctx.env.DISCORD_BOT_TOKEN);
      const giveaway = await getGiveaway(ctx);
      const id = ctx.state.id.toString();

      // Verify giveaway is in the right state
      validateGiveawayState(giveaway, ["OPEN"]);

      // Update the giveaway with new data
      const updated = await db
        .update(D1Schema.giveaways)
        .set({
          prize: input.prize,
          winners: input.winners,
          description: input.description,
        })
        .where(eq(D1Schema.giveaways.durableObjectId, id))
        .returning()
        .get();

      // Get current entries count
      const _entries = await db
        .select({ count: sql<number>`count(*)` })
        .from(D1Schema.entries)
        .where(eq(D1Schema.entries.giveawayId, updated.messageId))
        .get();

      // Update the Discord message
      try {
        await client.patch(
          Routes.channelMessage(updated.channelId, updated.messageId),
          {
            body: {
              components: createGiveawayComponents({
                prize: updated.prize,
                winners: updated.winners,
                end_time: new Date(updated.endTime),
                host_username: "",
                host_id: updated.hostId,
                description: input.description ?? undefined,
                giveaway_id: updated.messageId,
                join_button: JoinButton.createActionRow(
                  updated.durableObjectId,
                ),
              }),
            },
          },
        );
      } catch (error) {
        console.error("Failed to update giveaway message:", error);
        // Don't throw here, as the database update was successful
      }

      return {
        success: true,
        giveaway: {
          ...updated,
          end_time: updated.endTime,
        },
      };
    }),

  addEntry: publicProcedure
    .input(
      z.object({
        user_id: z.string(),
        username: z.string(),
        discriminator: z.string(),
        avatar: z.string().nullable(),
      }),
    )
    .use(entryRateLimit)
    .mutation(async ({ input, ctx }) => {
      const giveaway = await getGiveaway(ctx);
      validateGiveawayState(giveaway, ["OPEN"]);

      // Check if entry already exists
      const existingEntry = entriesDb.getByUserId(ctx, input.user_id);

      if (existingEntry) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User has already entered this giveaway",
        });
      }

      // Add entry to local database
      entriesDb.create(ctx, {
        userId: input.user_id,
        username: input.username,
        avatar: input.avatar,
      });

      return {
        success: true,
        entry: {
          userId: input.user_id,
          username: input.username,
          avatar: input.avatar,
          winner: false,
          createdAt: new Date(),
        },
      };
    }),

  removeEntry: publicProcedure
    .input(z.object({ user_id: z.string() }))
    .use(exitRateLimit)
    .mutation(async ({ input, ctx }) => {
      const giveaway = await getGiveaway(ctx);
      validateGiveawayState(giveaway, ["OPEN"]);

      // Check if entry exists
      const existingEntry = entriesDb.getByUserId(ctx, input.user_id);

      if (!existingEntry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User has not entered this giveaway",
        });
      }

      // Delete from local database
      entriesDb.delete(ctx, input.user_id);

      return {
        success: true,
        entry: existingEntry,
      };
    }),

  getState: publicProcedure.query(async ({ ctx }) => {
    return getGiveaway(ctx);
  }),

  endGiveaway: publicProcedure.mutation(async ({ ctx }) => {
    const db = drizzleD1(ctx.env.D1);
    const giveaway = await getGiveaway(ctx);
    const id = ctx.state.id.toString();

    validateGiveawayState(giveaway, ["OPEN"]);

    await db
      .update(D1Schema.giveaways)
      .set({ state: "CLOSED" })
      .where(eq(D1Schema.giveaways.durableObjectId, id))
      .run();

    await ctx.state.storage.setAlarm(1);
    return { success: true };
  }),

  getActiveGiveaways: publicProcedure
    .input(z.object({ guild_id: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = drizzleD1(ctx.env.D1);

      return db
        .select()
        .from(D1Schema.giveaways)
        .where(
          and(
            eq(D1Schema.giveaways.guildId, input.guild_id),
            eq(D1Schema.giveaways.state, "OPEN"),
          ),
        )
        .orderBy(D1Schema.giveaways.endTime)
        .all();
    }),
});

export type StateRouter = typeof stateRouter;
