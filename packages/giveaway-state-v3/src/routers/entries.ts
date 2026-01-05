/// <reference types="@dougley/types/giveaway-types" />

import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import createRateLimitMiddleware from "../middleware";
import { entriesDb, getGiveaway, validateGiveawayState } from "../utils";
import { publicProcedure, t } from "./instance";

// Create rate limited procedures for entry operations
const entryRateLimit = createRateLimitMiddleware(t, {
  action: "join",
  cooldown: 5000,
});

const exitRateLimit = createRateLimitMiddleware(t, {
  action: "leave",
  cooldown: 5000,
});

/**
 * Entries router - manages giveaway participant entries
 *
 * Handles join/leave operations and entry listing with rate limiting.
 */
export const entriesRouter = {
  /**
   * Get all entries for the current giveaway
   */
  getAll: publicProcedure.query(async ({ ctx }) => {
    return entriesDb.getAll(ctx);
  }),

  /**
   * Get paginated entries
   */
  getPaginated: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(25),
      })
    )
    .query(async ({ ctx, input }) => {
      return entriesDb.getPaginated(ctx, input);
    }),

  /**
   * Add a new entry to the giveaway
   *
   * Rate limited to prevent spam. Validates giveaway is OPEN.
   */
  add: publicProcedure
    .input(
      z.object({
        user_id: z.string(),
        username: z.string(),
        discriminator: z.string(),
        avatar: z.string().nullable(),
      })
    )
    .use(entryRateLimit)
    .mutation(async ({ input, ctx }) => {
      const giveawayId = ctx.state.id.toString();

      console.log("[entries] add.start", {
        giveawayId,
        userId: input.user_id,
        username: input.username,
      });

      const giveaway = await getGiveaway(ctx);
      validateGiveawayState(giveaway, ["OPEN"]);

      // Check if entry already exists
      const existingEntry = entriesDb.getByUserId(ctx, input.user_id);

      if (existingEntry) {
        console.warn("[entries] add.already_entered", {
          giveawayId,
          userId: input.user_id,
        });
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

      console.log("[entries] add.success", {
        giveawayId,
        userId: input.user_id,
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

  /**
   * Remove an entry from the giveaway
   *
   * Rate limited to prevent spam. Validates giveaway is OPEN.
   */
  remove: publicProcedure
    .input(z.object({ user_id: z.string() }))
    .use(exitRateLimit)
    .mutation(async ({ input, ctx }) => {
      const giveawayId = ctx.state.id.toString();

      console.log("[entries] remove.start", {
        giveawayId,
        userId: input.user_id,
      });

      const giveaway = await getGiveaway(ctx);
      validateGiveawayState(giveaway, ["OPEN"]);

      // Check if entry exists
      const existingEntry = entriesDb.getByUserId(ctx, input.user_id);

      if (!existingEntry) {
        console.warn("[entries] remove.not_found", {
          giveawayId,
          userId: input.user_id,
        });
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User has not entered this giveaway",
        });
      }

      // Delete from local database
      entriesDb.delete(ctx, input.user_id);

      console.log("[entries] remove.success", {
        giveawayId,
        userId: input.user_id,
      });

      return {
        success: true,
        entry: existingEntry,
      };
    }),
} satisfies TRPCRouterRecord;
