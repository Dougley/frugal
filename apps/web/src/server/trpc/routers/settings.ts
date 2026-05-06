import { eq, sql } from "@dougley/frugal-drizzle/workers";
import * as Schema from "@dougley/frugal-drizzle/workers/schema.js";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure } from "../instance";
import { validateGuildPermission } from "../utils";

export const settingsRouter = {
  getGuildSettings: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ ctx, input }) => {
      await validateGuildPermission(ctx, input.guildId, "settings.view");

      const row = await ctx.db.query.guildSettings.findFirst({
        where: eq(Schema.guildSettings.guildId, input.guildId),
      });

      return {
        defaultChannelId: row?.defaultChannelId ?? null,
        pingRoleId: row?.pingRoleId ?? null,
        requiredRoles: row?.requiredRoles ?? [],
        accentColor: row?.accentColor ?? "#4c6ef5",
      };
    }),

  updateGuildSettings: protectedProcedure
    .input(
      z.object({
        guildId: z.string(),
        defaultChannelId: z.string().nullable().optional(),
        pingRoleId: z.string().nullable().optional(),
        requiredRoles: z.array(z.string()).optional(),
        accentColor: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/)
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { guildId, ...values } = input;
      await validateGuildPermission(ctx, guildId, "settings.update");

      const row = {
        guildId,
        defaultChannelId: values.defaultChannelId ?? null,
        pingRoleId: values.pingRoleId ?? null,
        requiredRoles: values.requiredRoles ?? [],
        accentColor: values.accentColor ?? "#4c6ef5",
      };

      await ctx.db
        .insert(Schema.guildSettings)
        .values(row)
        .onConflictDoUpdate({
          target: Schema.guildSettings.guildId,
          set: {
            defaultChannelId: row.defaultChannelId,
            pingRoleId: row.pingRoleId,
            requiredRoles: row.requiredRoles,
            accentColor: row.accentColor,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          },
        });

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
