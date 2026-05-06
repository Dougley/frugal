import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getCachedGuildResources } from "~/server/auth/discord";
import { protectedProcedure } from "../instance";
import { validateGuildPermission } from "../utils";

const RESOURCES_CACHE_KEY = (guildId: string) => `discord:resources:${guildId}`;
const RESOURCES_RL_KEY = (guildId: string) => `discord:resources:rl:${guildId}`;
const REFRESH_COOLDOWN_SECONDS = 60;

export const guildRouter = {
  getGuildResources: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ ctx, input }) => {
      await validateGuildPermission(ctx, input.guildId, "giveaways.list");

      return getCachedGuildResources(
        ctx.env.AUTH_KV,
        ctx.env.DISCORD_BOT_TOKEN,
        input.guildId
      );
    }),

  refreshGuildResources: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await validateGuildPermission(ctx, input.guildId, "giveaways.list");

      const rlKey = RESOURCES_RL_KEY(input.guildId);
      if (await ctx.env.AUTH_KV.get(rlKey)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Please wait before refreshing again.",
        });
      }

      await Promise.all([
        ctx.env.AUTH_KV.put(rlKey, "1", {
          expirationTtl: REFRESH_COOLDOWN_SECONDS,
        }),
        ctx.env.AUTH_KV.delete(RESOURCES_CACHE_KEY(input.guildId)),
      ]);

      return getCachedGuildResources(
        ctx.env.AUTH_KV,
        ctx.env.DISCORD_BOT_TOKEN,
        input.guildId
      );
    }),
} satisfies TRPCRouterRecord;
