/// <reference types="@dougley/types/summaries" />
/// <reference types="@dougley/types/giveaway-types" />

import {
  and,
  Schema as D1Schema,
  drizzleD1,
  eq,
} from "@dougley/frugal-drizzle/workers";
import { createGiveawayComponents, JoinButton } from "@dougley/frugal-utils";
import type { TRPCRouterRecord } from "@trpc/server";
import { Routes } from "discord-api-types/v10";
import { z } from "zod";

import {
  createDiscordRest,
  entriesDb,
  getGiveaway,
  validateGiveawayState,
} from "../utils";
import { publicProcedure } from "./instance";
import { ensureGuildConcurrentGiveawaySlotReserved } from "./slots";

/**
 * Giveaway router - manages giveaway lifecycle
 *
 * Handles creating, updating, ending giveaways and drawing winners.
 */
export const giveawayRouter = {
  /**
   * Get current giveaway state
   */
  getState: publicProcedure.query(async ({ ctx }) => {
    return getGiveaway(ctx);
  }),

  /**
   * Get all active giveaways for a guild
   */
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
            eq(D1Schema.giveaways.state, "OPEN")
          )
        )
        .orderBy(D1Schema.giveaways.endTime)
        .all();
    }),

  /**
   * Begin a new giveaway
   *
   * Creates the giveaway record in D1 with NEW state.
   * Must call startAlarm afterwards to transition to OPEN.
   */
  begin: publicProcedure
    .input(
      z.object({
        message_id: z.string(),
        channel_id: z.string(),
        guild_id: z.string(),
        prize: z.string(),
        winners: z.number().min(1),
        end_time: z.iso.datetime().transform((val) => new Date(val)),
        host_id: z.string(),
        description: z.string().optional(),
        locale: z.string().default("en-US"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = drizzleD1(ctx.env.D1);
      const id = ctx.state.id.toString();

      console.log("[giveaway] begin.start", {
        giveawayId: id,
        guildId: input.guild_id,
        channelId: input.channel_id,
        prize: input.prize,
        winners: input.winners,
        endTime: input.end_time.toISOString(),
        locale: input.locale,
      });

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
          locale: input.locale,
        })
        .returning()
        .get();

      console.log("[giveaway] begin.success", {
        giveawayId: id,
        guildId: input.guild_id,
      });

      return {
        success: true,
        giveaway: {
          ...giveaway,
          end_time: giveaway.endTime,
        },
      };
    }),

  /**
   * Start the alarm to end the giveaway at the specified time
   *
   * Transitions the giveaway from NEW to OPEN state and reserves
   * a concurrent giveaway slot.
   */
  startAlarm: publicProcedure
    .input(
      z.iso
        .datetime({ offset: true })
        .transform((value) => new Date(value))
        .refine((value) => value > new Date(), {
          message: "Date must be in the future",
        })
        .or(z.literal(1)) // Special case to trigger immediately
    )
    .mutation(async ({ input, ctx }) => {
      const id = ctx.state.id.toString();

      console.log("[giveaway] startAlarm.start", {
        giveawayId: id,
        scheduledTime:
          typeof input === "number" ? "immediate" : input.toISOString(),
      });

      if (typeof input === "number" && input === 1) {
        await ctx.state.storage.setAlarm(input);
        console.log("[giveaway] startAlarm.immediate", { giveawayId: id });
        return { success: true };
      }

      const db = drizzleD1(ctx.env.D1);

      // Reserve a concurrent giveaway slot before opening.
      const giveaway = await getGiveaway(ctx);
      validateGiveawayState(giveaway, ["NEW"]);

      await ensureGuildConcurrentGiveawaySlotReserved(
        ctx,
        db,
        giveaway.guildId
      );

      await db
        .update(D1Schema.giveaways)
        .set({ state: "OPEN" })
        .where(eq(D1Schema.giveaways.durableObjectId, id))
        .run();

      await ctx.state.storage.setAlarm(input);

      console.log("[giveaway] startAlarm.success", {
        giveawayId: id,
        guildId: giveaway.guildId,
        scheduledTime: input.toISOString(),
      });

      return { success: true };
    }),

  /**
   * Update a giveaway's prize, winners, or description
   *
   * Also updates the Discord message with the new details.
   */
  update: publicProcedure
    .input(
      z.object({
        prize: z.string().min(1).max(100),
        winners: z.number().min(1).max(50),
        description: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = drizzleD1(ctx.env.D1);
      const rest = createDiscordRest(ctx.env.DISCORD_BOT_TOKEN);
      const giveaway = await getGiveaway(ctx);
      const id = ctx.state.id.toString();

      console.log("[giveaway] update.start", {
        giveawayId: id,
        prize: input.prize,
        winners: input.winners,
        hasDescription: !!input.description,
      });

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

      // Update the Discord message
      try {
        await rest.patch(
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
                giveaway_id: updated.durableObjectId,
                join_button: JoinButton.createActionRow(
                  updated.durableObjectId
                ),
              }),
            },
          }
        );
        console.log("[giveaway] update.discord_message_updated", {
          giveawayId: id,
        });
      } catch (error) {
        console.error("[giveaway] update.discord_message_failed", {
          giveawayId: id,
          error: error instanceof Error ? error.message : String(error),
        });
        // Don't throw here, as the database update was successful
      }

      console.log("[giveaway] update.success", { giveawayId: id });

      return {
        success: true,
        giveaway: {
          ...updated,
          end_time: updated.endTime,
        },
      };
    }),

  /**
   * End the giveaway immediately
   *
   * Triggers the alarm to fire immediately, which handles
   * drawing winners and announcing results.
   */
  end: publicProcedure.mutation(async ({ ctx }) => {
    const giveaway = await getGiveaway(ctx);
    const id = ctx.state.id.toString();

    console.log("[giveaway] end.start", {
      giveawayId: id,
      guildId: giveaway.guildId,
    });

    validateGiveawayState(giveaway, ["OPEN"]);

    // Trigger the alarm immediately - it will handle drawing winners,
    // announcing results, and setting the CLOSED state
    await ctx.state.storage.setAlarm(1);

    console.log("[giveaway] end.alarm_triggered", { giveawayId: id });

    return { success: true };
  }),

  /**
   * Draw winners from the entries
   *
   * Selects random winners and marks them in the database.
   */
  drawWinners: publicProcedure
    .input(z.number().optional())
    .mutation(async ({ input, ctx }) => {
      const giveaway = await getGiveaway(ctx);
      const id = ctx.state.id.toString();
      const numWinners = input ?? giveaway.winners;

      console.log("[giveaway] drawWinners.start", {
        giveawayId: id,
        requestedWinners: numWinners,
      });

      // Use local SQLite to get random winners
      const winners = entriesDb.getRandomWinners(ctx, numWinners);

      if (winners.length > 0) {
        // Mark selected users as winners
        const winnerIds = winners
          .map((winner) => winner.userId)
          .filter(Boolean) as string[];
        entriesDb.markAsWinners(ctx, winnerIds);

        console.log("[giveaway] drawWinners.success", {
          giveawayId: id,
          winnersSelected: winners.length,
          winnerIds,
        });
      } else {
        console.log("[giveaway] drawWinners.no_winners", {
          giveawayId: id,
        });
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

  /**
   * Flush giveaway data to R2 storage
   *
   * Creates a summary of the giveaway for long-term storage.
   */
  flush: publicProcedure
    .input(
      z
        .object({
          id: z.string().min(1),
          username: z.string().min(1),
          discriminator: z.string().min(1),
          avatar: z.string().nullable(),
        })
        .array()
    )
    .mutation(async ({ input, ctx }) => {
      const giveaway = await getGiveaway(ctx);
      const id = ctx.state.id.toString();

      console.log("[giveaway] flush.start", {
        giveawayId: id,
        winnersCount: input.length,
      });

      validateGiveawayState(giveaway, ["CLOSED"]);

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

      console.log("[giveaway] flush.success", {
        giveawayId: id,
        r2Key: key,
        entriesCount: entrants.length,
      });

      return { success: true, object: key };
    }),

  /**
   * Clean up giveaway data
   *
   * Releases the slot reservation, deletes from D1, and clears
   * all Durable Object storage.
   */
  cleanup: publicProcedure.mutation(async ({ ctx }) => {
    const db = drizzleD1(ctx.env.D1);
    const giveaway = await getGiveaway(ctx);
    const id = ctx.state.id.toString();

    console.log("[giveaway] cleanup.start", {
      giveawayId: id,
      guildId: giveaway.guildId,
    });

    // Release any reservation (idempotent)
    await db
      .delete(D1Schema.guildActiveGiveaways)
      .where(eq(D1Schema.guildActiveGiveaways.durableObjectId, id))
      .run();

    // Delete from central database
    await db
      .delete(D1Schema.giveaways)
      .where(eq(D1Schema.giveaways.durableObjectId, id))
      .run();

    // This will delete all data in the durable object including the entries
    await ctx.state.storage.deleteAll();
    await ctx.state.storage.deleteAlarm();

    console.log("[giveaway] cleanup.success", {
      giveawayId: id,
      guildId: giveaway.guildId,
    });

    return { success: true };
  }),
} satisfies TRPCRouterRecord;
