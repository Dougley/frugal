import { DiscordApiClient } from "@discord-interactions/api";
import { PrismaClient, PrismaD1 } from "@dougley/d1-prisma";
import { createEndedGiveawayComponents } from "@dougley/frugal-utils";
import { Routes } from "discord-api-types/v10";
import { stateRouter } from "./router";
import type { Context } from "./trpc";

const CLEANUP_DELAY = 1000 * 60 * 60 * 24 * 14; // 14 days

export async function handleAlarm(
  ctx: Omit<Context<Env>, "req" | "resHeaders">,
) {
  console.log("Handling alarm");
  // Create a full context with dummy req and resHeaders
  const fullContext = {
    ...ctx,
    req: new Request("http://localhost"),
    resHeaders: new Headers(),
  };

  const adapter = new PrismaD1(ctx.env.D1);
  const prisma = new PrismaClient({ adapter });
  const client = new DiscordApiClient({
    userAgent:
      "DiscordBot (@giveawaybot/timer, v1; +https://github.com/dougley/frugal)",
  });

  client.setToken(ctx.env.DISCORD_BOT_TOKEN);

  const giveaway = await prisma.giveaways.findUnique({
    where: {
      durable_object_id: ctx.state.id.toString(),
    },
  });

  if (!giveaway) {
    return;
  }

  // If state is already CLOSED, run cleanup
  if (giveaway.state === "CLOSED") {
    await stateRouter.createCaller(fullContext).cleanup();
    return {
      success: true,
      cleanup: true,
    };
  }

  // Draw winners using existing procedure
  const drawResult = await stateRouter.createCaller(fullContext).drawWinners();

  // First try to edit the original giveaway message to indicate entries are closed
  try {
    // Use the helper function to create the embed
    const resp = await client.patch(
      Routes.channelMessage(giveaway.channel_id, giveaway.message_id),
      {
        body: {
          flags: 32768,
          components: createEndedGiveawayComponents({
            prize: giveaway.prize,
            winners: giveaway.winners,
            end_time: giveaway.end_time,
            host_username: "", // Set this to the actual username if available
            host_id: giveaway.host_id,
            description: giveaway.description || undefined,
            giveaway_id: giveaway.message_id,
            winners_list:
              drawResult.winners.length > 0
                ? drawResult.winners.map((w) => `<@${w.id}>`)
                : ["Nobody won"],
          }),
        },
      },
    );
    console.log("Successfully updated giveaway message to closed state", resp);
  } catch (error) {
    // If we encounter a 404 (message not found) or 403 (missing permissions),
    // log and continue with the giveaway ending process
    console.error("Error updating giveaway message:", error);

    // If this is a critical failure that indicates the bot can't access the channel at all,
    // we might want to just clean up immediately
    if (
      error instanceof Error &&
      typeof (error as any).code !== "undefined" &&
      ((error as any).code === 10008 || (error as any).code === 50001) // 10008 = Unknown Message, 50001 = Missing Access
    ) {
      console.log(
        "Message not accessible (404/403). Proceeding with cleanup immediately.",
      );
      await prisma.giveaways.update({
        where: {
          durable_object_id: ctx.state.id.toString(),
        },
        data: {
          state: "CLOSED",
        },
      });
      await ctx.state.storage.setAlarm(new Date(Date.now() + CLEANUP_DELAY));
      return {
        success: true,
        cleanup: true,
      };
    }
  }

  // Get entry count to distinguish between no entries and no valid winners
  const entries = await prisma.entries.count({
    where: {
      giveaway_id: giveaway.message_id,
    },
  });

  // Close the giveaway
  await prisma.giveaways.update({
    where: {
      durable_object_id: ctx.state.id.toString(),
    },
    data: {
      state: "CLOSED",
    },
  });

  // Handle case where there are no winners
  if (!drawResult.winners.length) {
    const noWinnersMessage =
      entries === 0
        ? `😔 The giveaway for **${giveaway.prize}** has ended, but nobody entered.\n\nBetter luck next time!`
        : `😔 The giveaway for **${giveaway.prize}** has ended, but no valid winners could be drawn.\n\nThank you to everyone who participated!`;

    await client.post(Routes.channelMessages(giveaway.channel_id), {
      body: {
        content: noWinnersMessage,
        message_reference: {
          message_id: giveaway.message_id,
          channel_id: giveaway.channel_id,
          guild_id: giveaway.guild_id,
        },
        allowed_mentions: {
          everyone: false,
          roles: [],
        },
      },
    });

    // Set cleanup alarm even if there are no winners
    await ctx.state.storage.setAlarm(new Date(Date.now() + CLEANUP_DELAY));

    return {
      success: true,
      winners: [],
      object: null,
    };
  }

  // Continue with normal winner announcement if there are winners
  const flushResult = await stateRouter.createCaller(fullContext).flush(
    drawResult.winners.map((w) => ({
      id: String(w.id ?? ""),
      username: String(w.username ?? ""),
      discriminator: String("0"),
      avatar: w.avatar === null ? null : String(w.avatar),
    })),
  );

  const winnerMentions = drawResult.winners.map((w) => `<@${w.id}>`).join(", ");

  await client.post(Routes.channelMessages(giveaway.channel_id), {
    body: {
      content: `🎉 The giveaway for **${giveaway.prize}** has ended!\n\nCongratulations to the winners: ${winnerMentions}\n\nThank you to everyone who participated!`,
      message_reference: {
        message_id: giveaway.message_id,
        channel_id: giveaway.channel_id,
        guild_id: giveaway.guild_id,
      },
      allowed_mentions: {
        users: drawResult.winners.map((w) => w.id),
        everyone: false,
        roles: [],
      },
    },
  });

  // Set cleanup alarm
  await ctx.state.storage.setAlarm(new Date(Date.now() + CLEANUP_DELAY));

  return {
    success: true,
    winners: drawResult.winners,
    object: flushResult.object,
  };
}
