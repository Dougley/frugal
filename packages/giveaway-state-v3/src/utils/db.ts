/// <reference types="@dougley/types/giveaway-types" />

import {
  Schema as DurableSchema,
  drizzleDurable,
} from "@dougley/frugal-drizzle/durables";
import {
  Schema as D1Schema,
  drizzleD1,
  eq,
  inArray,
  sql,
} from "@dougley/frugal-drizzle/workers";
import { TRPCError } from "@trpc/server";
import type { Context } from "../trpc";

/**
 * Get giveaway from D1 by durable object ID
 */
export async function getGiveaway(ctx: Context<LegacyEnv>) {
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
 * Functions for working with the local SQLite database (Durable Object storage)
 */
export const entriesDb = {
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
   * Get paginated entries
   */
  getPaginated: (
    ctx: Context<LegacyEnv>,
    options: { page: number; limit: number }
  ) => {
    const db = drizzleDurable(ctx.state.storage);
    const offset = (options.page - 1) * options.limit;

    const entries = db
      .select()
      .from(DurableSchema.entries)
      .orderBy(DurableSchema.entries.timestamp)
      .limit(options.limit)
      .offset(offset)
      .all();

    const countResult = db
      .select({ count: sql<number>`count(*)` })
      .from(DurableSchema.entries)
      .get();
    const total = countResult?.count ?? 0;

    return {
      entries,
      total,
      page: options.page,
      limit: options.limit,
      hasMore: offset + entries.length < total,
    };
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
    entry: { userId: string; username: string; avatar: string | null }
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
