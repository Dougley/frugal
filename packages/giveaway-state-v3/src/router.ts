/// <reference types="@dougley/types/summaries" />

import { PrismaClient, PrismaD1, getRandomWinners } from "@dougley/d1-prisma";
import { TRPCError, initTRPC } from "@trpc/server";
import type { Context } from "trpc-durable-objects";
import { z } from "zod";

const t = initTRPC.context<Context<Env>>().create();

const publicProcedure = t.procedure;

const router = t.router;

export const stateRouter = router({
  startAlarm: publicProcedure
    .input(
      // input is a ISO 8601 string, but should be tried to be parsed as a Date
      z
        .string()
        .datetime({
          offset: true,
        })
        .transform((value) => new Date(value))
        .refine((value) => value > new Date(), {
          message: "Date must be in the future",
        })
        .or(z.number().min(1).max(1)), // specifically to force-trigger alarms, if needed
    )
    .mutation(async ({ input, ctx }) => {
      const adapter = new PrismaD1(ctx.env.D1);
      const prisma = new PrismaClient({ adapter });
      await prisma.giveaways.update({
        where: {
          durable_object_id: ctx.state.id.toString(),
          state: "NEW",
        },
        data: {
          state: "OPEN",
        },
      });
      await ctx.state.storage.setAlarm(input);
      return {
        success: true,
      };
    }),

  drawWinners: publicProcedure.mutation(async ({ ctx }) => {
    const adapter = new PrismaD1(ctx.env.D1);
    const prisma = new PrismaClient({ adapter });
    const { id } = ctx.state;
    const info = await prisma.giveaways.findUnique({
      where: {
        durable_object_id: id.toString(),
      },
    });
    if (!info) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Giveaway not found",
      });
    }
    const { message_id, winners } = info;
    const entrants = await prisma.$queryRawTyped(
      getRandomWinners(message_id, winners),
    );
    const winnerIds = entrants.map(({ user_id }) => user_id);
    await prisma.entries.updateMany({
      where: {
        giveaway_id: message_id,
        user_id: {
          in: winnerIds,
        },
      },
      data: {
        winner: true,
      },
    });
    return {
      success: true,
      winners: entrants.map(({ user_id, username, discriminator, avatar }) => ({
        id: user_id,
        username,
        discriminator,
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
      const adapter = new PrismaD1(ctx.env.D1);
      const prisma = new PrismaClient({ adapter });
      const { id } = ctx.state;
      const info = await prisma.giveaways.findUnique({
        where: {
          durable_object_id: id.toString(),
        },
      });
      if (!info) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Giveaway not found",
        });
      }
      const { state, channel_id, message_id, winners, prize, end_time } = info;
      // state must be CLOSED, otherwise we can't flush
      if (state !== "CLOSED") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Giveaway must be closed to flush",
        });
      }
      const entrants = await prisma.entries.findMany({
        where: {
          giveaway_id: message_id,
        },
      });
      const summary: SummaryOutput = {
        _version: 2,
        entries: entrants.map(
          ({ user_id, username, discriminator, avatar }) => ({
            id: user_id,
            username,
            discriminator,
            avatar,
          }),
        ),
        details: {
          channel: channel_id,
          message: message_id,
          winners,
          prize,
          originalWinners: input.map((winner) => winner.id),
          time: {
            end: end_time.toISOString(),
            start: end_time.toISOString(),
          },
        },
      };
      const bucket = ctx.env.STORAGE;
      const key = `giveaway-${ctx.state.id.toString()}.json`;
      await bucket.put(key, JSON.stringify(summary), {
        httpMetadata: {
          contentType: "application/json",
          // objects expire in 3 months
          cacheExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 3),
          cacheControl: "public, max-age=7776000",
        },
      });
      return {
        success: true,
        object: key,
      };
    }),

  cleanup: publicProcedure.mutation(async ({ ctx }) => {
    const adapter = new PrismaD1(ctx.env.D1);
    const prisma = new PrismaClient({ adapter });
    const { id } = ctx.state;
    const giveaway = await prisma.giveaways.findUnique({
      where: {
        durable_object_id: id.toString(),
      },
    });
    if (!giveaway) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Giveaway not found",
      });
    }
    await prisma.entries.deleteMany({
      where: {
        giveaway_id: giveaway.message_id,
      },
    });
    await prisma.giveaways.delete({
      where: {
        durable_object_id: id.toString(),
      },
    });
    return {
      success: true,
    };
  }),
});

export type StateRouter = typeof stateRouter;
