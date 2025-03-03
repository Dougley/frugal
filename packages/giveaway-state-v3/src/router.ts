/// <reference types="@dougley/types/summaries" />

import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { GiveawayService } from "./services/giveaway";
import { transformer } from "./transformer";
import { type Context } from "./trpc";

const t = initTRPC.context<Context<Env>>().create({
  transformer,
});

const publicProcedure = t.procedure;
const router = t.router;

export const stateRouter = router({
  getEntries: publicProcedure.query(async ({ ctx }) => {
    const service = GiveawayService.getInstance(ctx);
    return service.getEntries();
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
      const service = GiveawayService.getInstance(ctx);
      const result = await service.startAlarm(input);
      await ctx.state.storage.setAlarm(input);
      return result;
    }),

  drawWinners: publicProcedure.mutation(async ({ ctx }) => {
    const service = GiveawayService.getInstance(ctx);
    return service.drawWinners();
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
      const service = GiveawayService.getInstance(ctx);
      const winners = input.map(({ id, ...rest }) => ({
        user_id: id,
        ...rest,
      }));
      return service.flushToStorage(ctx.env.STORAGE, winners);
    }),

  cleanup: publicProcedure.mutation(async ({ ctx }) => {
    const service = GiveawayService.getInstance(ctx);
    return service.cleanup();
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
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const service = GiveawayService.getInstance(ctx);
      return service.beginGiveaway(input);
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
    .mutation(async ({ input, ctx }) => {
      const service = GiveawayService.getInstance(ctx);
      return service.addEntry(input);
    }),

  removeEntry: publicProcedure
    .input(z.object({ user_id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const service = GiveawayService.getInstance(ctx);
      return service.removeEntry(input.user_id);
    }),

  getState: publicProcedure.query(async ({ ctx }) => {
    const service = GiveawayService.getInstance(ctx);
    return service.getGiveaway();
  }),

  endGiveaway: publicProcedure.mutation(async ({ ctx }) => {
    const service = GiveawayService.getInstance(ctx);
    const result = await service.endGiveaway();
    await ctx.state.storage.setAlarm(1);
    return result;
  }),

  getActiveGiveaways: publicProcedure
    .input(z.object({ guild_id: z.string() }))
    .query(async ({ input, ctx }) => {
      return GiveawayService.getActiveGiveaways(ctx, input.guild_id);
    }),
});

export type StateRouter = typeof stateRouter;
