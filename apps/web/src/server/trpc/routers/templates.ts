import { and, count, eq, sql } from "@dougley/frugal-drizzle/workers";
import * as Schema from "@dougley/frugal-drizzle/workers/schema.js";
import {
  FEATURE_LIMITS,
  getPremiumStatus,
} from "@dougley/frugal-subscriptions";
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure } from "../instance";
import { validateGuildPermission } from "../utils";

export const templatesRouter = {
  getGuildTemplates: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ ctx, input }) => {
      await validateGuildPermission(ctx, input.guildId, "templates.view");

      const subscription = await getPremiumStatus(
        { userId: ctx.user.id, guildId: input.guildId },
        ctx.db
      );

      if (!subscription.hasPremium) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "402 PREMIUM_REQUIRED",
        });
      }

      const templates = await ctx.db.query.giveawayTemplates.findMany({
        where: eq(Schema.giveawayTemplates.guildId, input.guildId),
        orderBy: (t, { desc }) => [desc(t.useCount), desc(t.createdAt)],
      });

      return templates;
    }),

  createTemplate: protectedProcedure
    .input(
      z.object({
        guildId: z.string(),
        name: z.string().min(1).max(100),
        prize: z.string().max(100).optional(),
        winners: z.number().int().min(1).max(50),
        durationMs: z.number().int().min(10_000),
        description: z.string().max(1000).optional(),
        channelId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await validateGuildPermission(ctx, input.guildId, "templates.manage");

      const subscription = await getPremiumStatus(
        { userId: ctx.user.id, guildId: input.guildId },
        ctx.db
      );

      if (!subscription.hasPremium) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "402 PREMIUM_REQUIRED",
        });
      }

      const existingCount = await ctx.db
        .select({ count: count() })
        .from(Schema.giveawayTemplates)
        .where(eq(Schema.giveawayTemplates.guildId, input.guildId));

      if ((existingCount[0]?.count ?? 0) >= FEATURE_LIMITS.MAX_TEMPLATES) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Template limit of ${FEATURE_LIMITS.MAX_TEMPLATES} reached.`,
        });
      }

      const id = crypto.randomUUID();

      try {
        await ctx.db.insert(Schema.giveawayTemplates).values({
          id,
          guildId: input.guildId,
          name: input.name,
          prize: input.prize ?? null,
          winners: input.winners,
          durationMs: input.durationMs,
          description: input.description ?? null,
          channelId: input.channelId ?? null,
          useCount: 0,
        });
      } catch (e) {
        if (
          e instanceof Error &&
          e.message.includes("UNIQUE constraint failed")
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A template with that name already exists in this server.",
          });
        }
        throw e;
      }

      return { id };
    }),

  updateTemplate: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        guildId: z.string(),
        name: z.string().min(1).max(100),
        prize: z.string().max(100).optional(),
        winners: z.number().int().min(1).max(50),
        durationMs: z.number().int().min(10_000),
        description: z.string().max(1000).optional(),
        channelId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await validateGuildPermission(ctx, input.guildId, "templates.manage");

      const template = await ctx.db.query.giveawayTemplates.findFirst({
        where: and(
          eq(Schema.giveawayTemplates.id, input.id),
          eq(Schema.giveawayTemplates.guildId, input.guildId)
        ),
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      }

      try {
        await ctx.db
          .update(Schema.giveawayTemplates)
          .set({
            name: input.name,
            prize: input.prize ?? null,
            winners: input.winners,
            durationMs: input.durationMs,
            description: input.description ?? null,
            channelId: input.channelId ?? null,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(Schema.giveawayTemplates.id, input.id));
      } catch (e) {
        if (
          e instanceof Error &&
          e.message.includes("UNIQUE constraint failed")
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A template with that name already exists in this server.",
          });
        }
        throw e;
      }

      return { success: true };
    }),

  deleteTemplate: protectedProcedure
    .input(z.object({ id: z.string(), guildId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await validateGuildPermission(ctx, input.guildId, "templates.manage");

      const template = await ctx.db.query.giveawayTemplates.findFirst({
        where: and(
          eq(Schema.giveawayTemplates.id, input.id),
          eq(Schema.giveawayTemplates.guildId, input.guildId)
        ),
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      }

      await ctx.db
        .delete(Schema.giveawayTemplates)
        .where(eq(Schema.giveawayTemplates.id, input.id));

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
