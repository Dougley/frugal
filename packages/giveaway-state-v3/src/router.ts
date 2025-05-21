/// <reference types="@dougley/types/summaries" />
/// <reference types="@dougley/types/giveaway-types" />

import { DiscordApiClient } from "@discord-interactions/api";
import { PrismaClient, PrismaD1 } from "@dougley/d1-prisma";
import { createGiveawayComponents, JoinButton } from "@dougley/frugal-utils";
import { initTRPC, TRPCError } from "@trpc/server";
import { Routes } from "discord-api-types/v10";
import { z } from "zod";
import createRateLimitMiddleware from "./middleware";
import { transformer } from "./transformer";
import { type Context } from "./trpc";

// TRPC Setup
const t = initTRPC.context<Context<Env>>().create({
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
async function getGiveaway(ctx: Context<Env>) {
  const adapter = new PrismaD1(ctx.env.D1);
  const prisma = new PrismaClient({ adapter });
  const id = ctx.state.id.toString();

  const giveaway = await prisma.giveaways.findUnique({
    where: { durable_object_id: id },
  });

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
  getAll: (ctx: Context<Env>) => {
    return ctx.state.storage.sql
      .exec(
        `
      SELECT * FROM entries
    `,
      )
      .toArray();
  },

  /**
   * Get a count of all entries
   */
  count: (ctx: Context<Env>) => {
    const result = ctx.state.storage.sql
      .exec(
        `
      SELECT COUNT(*) as count FROM entries
    `,
      )
      .toArray();
    return result[0]?.count ?? 0;
  },

  /**
   * Get a single entry by userId
   */
  getByUserId: (ctx: Context<Env>, userId: string) => {
    return ctx.state.storage.sql
      .exec(
        `
      SELECT * FROM entries WHERE userId = ?
    `,
        userId,
      )
      .toArray()[0];
  },

  /**
   * Add a new entry
   */
  create: (
    ctx: Context<Env>,
    entry: { userId: string; username: string; avatar: string | null },
  ) => {
    return ctx.state.storage.sql.exec(
      `
      INSERT INTO entries (userId, username, avatar)
      VALUES (?, ?, ?)
    `,
      entry.userId,
      entry.username,
      entry.avatar,
    );
  },

  /**
   * Delete an entry by userId
   */
  delete: (ctx: Context<Env>, userId: string) => {
    return ctx.state.storage.sql.exec(
      `
      DELETE FROM entries WHERE userId = ?
    `,
      userId,
    );
  },

  /**
   * Get random winners
   */
  getRandomWinners: (ctx: Context<Env>, limit: number) => {
    return ctx.state.storage.sql
      .exec(
        `
        SELECT *
        FROM entries
        WHERE ROWID IN (
          SELECT ROWID
          FROM entries
          WHERE winner = 0
          ORDER BY RANDOM()
          LIMIT ?
        )
        ORDER BY RANDOM()
        `,
        limit,
      )
      .toArray();
  },

  /**
   * Mark users as winners
   */
  markAsWinners: (ctx: Context<Env>, userIds: string[]) => {
    if (userIds.length === 0) return;

    // Use placeholders for each userId
    const placeholders = userIds.map(() => "?").join(",");

    return ctx.state.storage.sql.exec(
      `
      UPDATE entries 
      SET winner = 1 
      WHERE userId IN (${placeholders})
    `,
      ...userIds,
    );
  },

  /**
   * Get all winners
   */
  getWinners: (ctx: Context<Env>) => {
    return ctx.state.storage.sql
      .exec(
        `
      SELECT * FROM entries WHERE winner = 1
    `,
      )
      .toArray();
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

      const adapter = new PrismaD1(ctx.env.D1);
      const prisma = new PrismaClient({ adapter });
      const id = ctx.state.id.toString();

      await prisma.giveaways.update({
        where: {
          durable_object_id: id,
          state: "NEW",
        },
        data: { state: "OPEN" },
      });

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
          channel: giveaway.channel_id,
          message: giveaway.message_id,
          winners: giveaway.winners,
          prize: giveaway.prize,
          originalWinners: winners.map((w) => w.user_id),
          time: {
            end: giveaway.end_time.toISOString(),
            start: giveaway.end_time.toISOString(),
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
    const adapter = new PrismaD1(ctx.env.D1);
    const prisma = new PrismaClient({ adapter });
    const giveaway = await getGiveaway(ctx);
    const id = ctx.state.id.toString();

    // Delete from central database
    await prisma.giveaways.delete({
      where: { durable_object_id: id },
    });

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
      const adapter = new PrismaD1(ctx.env.D1);
      const prisma = new PrismaClient({ adapter });
      const id = ctx.state.id.toString();

      const giveaway = await prisma.giveaways.create({
        data: {
          durable_object_id: id,
          ...input,
          state: "NEW",
        },
      });

      return {
        success: true,
        giveaway: {
          ...giveaway,
          end_time: giveaway.end_time.toISOString(),
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
      const adapter = new PrismaD1(ctx.env.D1);
      const prisma = new PrismaClient({ adapter });
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
      const updated = await prisma.giveaways.update({
        where: { durable_object_id: id },
        data: {
          prize: input.prize,
          winners: input.winners,
          description: input.description,
        },
      });

      // Get current entries count
      const entries = await prisma.entries.count({
        where: { giveaway_id: updated.message_id },
      });

      // Update the Discord message
      try {
        await client.patch(
          Routes.channelMessage(updated.channel_id, updated.message_id),
          {
            body: {
              components: createGiveawayComponents({
                ...updated,
                description: input.description ?? undefined,
                host_username: "",
                giveaway_id: "",
                join_button: JoinButton.createActionRow(
                  updated.durable_object_id,
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
          end_time: updated.end_time.toISOString(),
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
    const adapter = new PrismaD1(ctx.env.D1);
    const prisma = new PrismaClient({ adapter });
    const giveaway = await getGiveaway(ctx);
    const id = ctx.state.id.toString();

    validateGiveawayState(giveaway, ["OPEN"]);

    await prisma.giveaways.update({
      where: { durable_object_id: id },
      data: { state: "CLOSED" },
    });

    await ctx.state.storage.setAlarm(1);
    return { success: true };
  }),

  getActiveGiveaways: publicProcedure
    .input(z.object({ guild_id: z.string() }))
    .query(async ({ input, ctx }) => {
      const adapter = new PrismaD1(ctx.env.D1);
      const prisma = new PrismaClient({ adapter });

      return prisma.giveaways.findMany({
        where: {
          guild_id: input.guild_id,
          state: "OPEN",
        },
        orderBy: { end_time: "asc" },
      });
    }),
});

export type StateRouter = typeof stateRouter;
export type t = typeof t;
