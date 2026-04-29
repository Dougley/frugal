/// <reference types="@dougley/types/giveaway-types" />

import {
  Schema as D1Schema,
  drizzleD1,
  eq,
  sql,
} from "@dougley/frugal-drizzle/workers";
import {
  checkFeatureLimit,
  FEATURE_LIMITS,
  getGuildSubscriptionStatus,
  getPremiumStatus,
} from "@dougley/frugal-subscriptions";
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Context } from "../trpc";
import { publicProcedure } from "./instance";

/**
 * Reconciles orphaned guild reservations
 *
 * Cleans up reservations that don't have matching OPEN giveaways
 * after a grace period.
 */
async function reconcileGuildReservations(
  db: ReturnType<typeof drizzleD1>,
  guildId: string
) {
  const orphanGraceMinutes = 2;

  await db.run(
    sql`
      DELETE FROM ${D1Schema.guildActiveGiveaways}
      WHERE ${D1Schema.guildActiveGiveaways.guildId} = ${guildId}
        AND datetime(${D1Schema.guildActiveGiveaways.createdAt}) < datetime('now', '-' || ${orphanGraceMinutes} || ' minutes')
        AND ${D1Schema.guildActiveGiveaways.durableObjectId} NOT IN (
          SELECT ${D1Schema.giveaways.durableObjectId}
          FROM ${D1Schema.giveaways}
          WHERE ${D1Schema.giveaways.guildId} = ${guildId}
            AND ${D1Schema.giveaways.state} = 'OPEN'
        )
    `
  );
}

/**
 * Cleans up orphaned giveaway records that got stuck in NEW state.
 */
async function reconcileOrphanedGiveaways(
  db: ReturnType<typeof drizzleD1>,
  guildId: string
) {
  await db.run(
    sql`
      DELETE FROM ${D1Schema.giveaways}
      WHERE ${D1Schema.giveaways.guildId} = ${guildId}
        AND ${D1Schema.giveaways.state} = 'NEW'
        AND datetime(${D1Schema.giveaways.endTime}) < datetime('now')
    `
  );
}

/**
 * Ensures a concurrent giveaway slot is reserved for the guild.
 */
export async function ensureGuildConcurrentGiveawaySlotReserved(
  ctx: Context<LegacyEnv>,
  db: ReturnType<typeof drizzleD1>,
  guildId: string
) {
  const durableObjectId = ctx.state.id.toString();

  await reconcileGuildReservations(db, guildId);
  await reconcileOrphanedGiveaways(db, guildId);

  const existing = await db
    .select({
      guildId: D1Schema.guildActiveGiveaways.guildId,
      durableObjectId: D1Schema.guildActiveGiveaways.durableObjectId,
    })
    .from(D1Schema.guildActiveGiveaways)
    .where(eq(D1Schema.guildActiveGiveaways.durableObjectId, durableObjectId))
    .get();

  if (existing) {
    if (existing.guildId === guildId) return;

    await db
      .delete(D1Schema.guildActiveGiveaways)
      .where(eq(D1Schema.guildActiveGiveaways.durableObjectId, durableObjectId))
      .run();
  }

  const subscription = await getGuildSubscriptionStatus(guildId, db);
  const maxConcurrent = subscription.hasPremium
    ? FEATURE_LIMITS.CONCURRENT_GIVEAWAYS.PREMIUM
    : FEATURE_LIMITS.CONCURRENT_GIVEAWAYS.FREE;

  let insertResult: Awaited<ReturnType<typeof db.run>>;

  try {
    insertResult = await db.run(
      sql`
        INSERT INTO ${D1Schema.guildActiveGiveaways}
          (${sql.raw('"guild_id"')}, ${sql.raw('"durable_object_id"')})
        SELECT ${guildId}, ${durableObjectId}
        WHERE (
          SELECT count(*) FROM ${D1Schema.guildActiveGiveaways}
          WHERE guild_id = ${guildId}
        ) < ${maxConcurrent}
      `
    );
  } catch (error) {
    console.error("[reservations] ensure.insert.failed", {
      guildId,
      durableObjectId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "RESERVATION_DB_ERROR",
    });
  }

  const changes = insertResult?.meta?.changes ?? 0;

  if (changes === 0) {
    console.warn("[reservations] ensure.limit_exceeded", {
      guildId,
      durableObjectId,
      maxConcurrent,
    });

    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "CONCURRENT_LIMIT_EXCEEDED",
    });
  }
}

/**
 * Slots router - manages concurrent giveaway slot reservations
 *
 * Controls how many giveaways a guild can have running simultaneously
 * based on their subscription tier.
 */
export const slotsRouter = {
  /**
   * Reserve a concurrent giveaway slot for a guild
   *
   * Must be called before starting a giveaway. Validates the guild
   * hasn't exceeded their concurrent limit.
   */
  reserve: publicProcedure
    .input(
      z.object({
        guild_id: z.string().min(1),
        host_id: z.string().optional(),
        winners: z.number().optional(),
        end_time: z.iso.datetime({ offset: true }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = drizzleD1(ctx.env.D1);

      if (input.host_id && (input.winners !== undefined || input.end_time)) {
        const subscription = await getPremiumStatus(
          { userId: input.host_id, guildId: input.guild_id },
          db
        );

        if (input.winners !== undefined) {
          const limit = checkFeatureLimit(
            subscription,
            input.winners,
            FEATURE_LIMITS.MAX_WINNERS.FREE,
            FEATURE_LIMITS.MAX_WINNERS.PREMIUM
          );
          if (!limit.allowed) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "PREMIUM_WINNERS_LIMIT",
            });
          }
        }

        if (input.end_time) {
          const durationDays =
            (new Date(input.end_time).getTime() - Date.now()) /
            (24 * 60 * 60 * 1000);
          const limit = checkFeatureLimit(
            subscription,
            durationDays,
            FEATURE_LIMITS.GIVEAWAY_DURATION_DAYS.FREE,
            FEATURE_LIMITS.GIVEAWAY_DURATION_DAYS.PREMIUM
          );
          if (!limit.allowed) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "PREMIUM_DURATION_LIMIT",
            });
          }
        }
      }

      await ensureGuildConcurrentGiveawaySlotReserved(ctx, db, input.guild_id);
      return { success: true };
    }),

  /**
   * Release a concurrent giveaway slot
   *
   * Called when a giveaway ends or is cancelled.
   */
  release: publicProcedure.mutation(async ({ ctx }) => {
    const db = drizzleD1(ctx.env.D1);
    const id = ctx.state.id.toString();

    await db
      .delete(D1Schema.guildActiveGiveaways)
      .where(eq(D1Schema.guildActiveGiveaways.durableObjectId, id))
      .run();

    return { success: true };
  }),
} satisfies TRPCRouterRecord;
