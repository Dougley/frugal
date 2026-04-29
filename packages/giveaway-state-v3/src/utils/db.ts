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

export const entriesDb = {
  getAll: (ctx: Context<LegacyEnv>) => {
    const db = drizzleDurable(ctx.state.storage);
    return db.select().from(DurableSchema.entries).all();
  },

  count: (ctx: Context<LegacyEnv>) => {
    const db = drizzleDurable(ctx.state.storage);
    const result = db
      .select({ count: sql<number>`count(*)` })
      .from(DurableSchema.entries)
      .get();
    return result?.count ?? 0;
  },

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

  getByUserId: (ctx: Context<LegacyEnv>, userId: string) => {
    const db = drizzleDurable(ctx.state.storage);
    return db
      .select()
      .from(DurableSchema.entries)
      .where(eq(DurableSchema.entries.userId, userId))
      .get();
  },

  /**
   * Atomically insert an entry. Returns the inserted row, or undefined if the
   * user already exists (ON CONFLICT DO NOTHING on primary key).
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
      .onConflictDoNothing()
      .returning()
      .get();
  },

  /**
   * Atomically delete an entry by userId. Returns the deleted row, or
   * undefined if the user was not entered.
   */
  delete: (ctx: Context<LegacyEnv>, userId: string) => {
    const db = drizzleDurable(ctx.state.storage);
    return db
      .delete(DurableSchema.entries)
      .where(eq(DurableSchema.entries.userId, userId))
      .returning()
      .get();
  },

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

  markAsWinners: (ctx: Context<LegacyEnv>, userIds: string[]) => {
    if (userIds.length === 0) return;

    const db = drizzleDurable(ctx.state.storage);
    return db
      .update(DurableSchema.entries)
      .set({ winner: true })
      .where(inArray(DurableSchema.entries.userId, userIds))
      .run();
  },

  getWinners: (ctx: Context<LegacyEnv>) => {
    const db = drizzleDurable(ctx.state.storage);
    return db
      .select()
      .from(DurableSchema.entries)
      .where(eq(DurableSchema.entries.winner, true))
      .all();
  },
};
