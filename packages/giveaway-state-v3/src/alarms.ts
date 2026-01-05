import {
  Schema as D1Schema,
  drizzleD1,
  eq,
} from "@dougley/frugal-drizzle/workers";
import { createEndedGiveawayComponents } from "@dougley/frugal-utils";
import * as Sentry from "@sentry/cloudflare";
import { Routes } from "discord-api-types/v10";
import { stateRouter } from "./router";
import type { Context } from "./trpc";
import { createDiscordRest, createGiveawayI18n } from "./utils";

const CLEANUP_DELAY = 1000 * 60 * 60 * 24 * 14; // 14 days

export async function handleAlarm(
  ctx: Omit<Context<LegacyEnv>, "req" | "resHeaders">
) {
  const giveawayId = ctx.state.id.toString();

  console.log("[alarm] start", { giveawayId });

  Sentry.addBreadcrumb({
    category: "giveaway.alarm",
    message: "handleAlarm.start",
    level: "info",
    data: { giveawayId },
  });

  // Create a full context with dummy req and resHeaders
  const fullContext = {
    ...ctx,
    req: new Request("http://localhost"),
    resHeaders: new Headers(),
  };

  const db = drizzleD1(ctx.env.D1);
  const rest = createDiscordRest(ctx.env.DISCORD_BOT_TOKEN);
  const i18n = createGiveawayI18n(ctx.env.KV_LOCALES);

  const giveaway = await db
    .select()
    .from(D1Schema.giveaways)
    .where(eq(D1Schema.giveaways.durableObjectId, giveawayId))
    .get();

  if (!giveaway) {
    console.warn("[alarm] giveaway_not_found", { giveawayId });
    return;
  }

  // Get the locale for this giveaway (defaults to en-US)
  const locale = giveaway.locale || "en-US";

  // If state is already CLOSED, run cleanup
  if (giveaway.state === "CLOSED") {
    console.log("[alarm] cleanup.already_closed", { giveawayId });
    await stateRouter.createCaller(fullContext).cleanup();
    return {
      success: true,
      cleanup: true,
    };
  }

  let drawResult: Awaited<
    ReturnType<ReturnType<typeof stateRouter.createCaller>["drawWinners"]>
  >;

  try {
    // Draw winners using existing procedure
    drawResult = await stateRouter.createCaller(fullContext).drawWinners();
  } catch (error) {
    console.error("[alarm] draw_winners.failed", {
      giveawayId,
      error: error instanceof Error ? error.message : String(error),
    });
    Sentry.captureException(error);
    throw error;
  }

  // Get translated "Nobody won" text for the embed
  const nobodyWonText = await i18n.translate("giveaway.ended.nobody_won", {
    language: locale,
  });

  // First try to edit the original giveaway message to indicate entries are closed
  try {
    // Use the helper function to create the embed
    await rest.patch(
      Routes.channelMessage(giveaway.channelId, giveaway.messageId),
      {
        body: {
          flags: 32768,
          components: createEndedGiveawayComponents({
            prize: giveaway.prize,
            winners: giveaway.winners,
            end_time: new Date(giveaway.endTime),
            host_username: "", // username may not be available here
            host_id: giveaway.hostId,
            description: giveaway.description || undefined,
            giveaway_id: giveawayId,
            winners_list: (() => {
              const mentions = drawResult.winners
                .map((w) => (w.id ? `<@${w.id}>` : null))
                .filter(
                  (mention): mention is string => typeof mention === "string"
                );
              return mentions.length > 0 ? mentions : [nobodyWonText];
            })(),
          }),
        },
      }
    );
    console.log("[alarm] discord_message.updated", { giveawayId });
  } catch (error) {
    // If we encounter a 404 (message not found) or 403 (missing permissions),
    // log and continue with the giveaway ending process
    console.error("[alarm] discord_message.update_failed", {
      giveawayId,
      error: error instanceof Error ? error.message : String(error),
    });

    // If this is a critical failure that indicates the bot can't access the channel at all,
    // we might want to just clean up immediately
    const errorWithCode = error as {
      code?: number;
      status?: number;
    };

    if (
      (typeof errorWithCode.code === "number" &&
        (errorWithCode.code === 10008 || errorWithCode.code === 50001)) ||
      (typeof errorWithCode.status === "number" &&
        (errorWithCode.status === 403 || errorWithCode.status === 404))
    ) {
      console.log("[alarm] message_inaccessible.cleanup_immediate", {
        giveawayId,
        errorCode: errorWithCode.code,
        errorStatus: errorWithCode.status,
      });
      await db
        .update(D1Schema.giveaways)
        .set({ state: "CLOSED" })
        .where(eq(D1Schema.giveaways.durableObjectId, giveawayId))
        .run();

      // Release concurrent giveaway reservation
      await db
        .delete(D1Schema.guildActiveGiveaways)
        .where(eq(D1Schema.guildActiveGiveaways.durableObjectId, giveawayId))
        .run();

      await ctx.state.storage.setAlarm(new Date(Date.now() + CLEANUP_DELAY));
      return {
        success: true,
        cleanup: true,
      };
    }
  }

  // Close the giveaway
  await db
    .update(D1Schema.giveaways)
    .set({ state: "CLOSED" })
    .where(eq(D1Schema.giveaways.durableObjectId, giveawayId))
    .run();

  // Release concurrent giveaway reservation
  await db
    .delete(D1Schema.guildActiveGiveaways)
    .where(eq(D1Schema.guildActiveGiveaways.durableObjectId, giveawayId))
    .run();

  // Handle case where there are no winners (either 0 entries or no eligible winners)
  if (!drawResult.winners.length) {
    console.log("[alarm] end.no_winners", {
      giveawayId,
      guildId: giveaway.guildId,
    });

    const noWinnersMessage = await i18n.translate("giveaway.ended.no_winners", {
      language: locale,
      params: { prize: giveaway.prize },
    });

    await rest.post(Routes.channelMessages(giveaway.channelId), {
      body: {
        content: noWinnersMessage,
        message_reference: {
          message_id: giveaway.messageId,
          channel_id: giveaway.channelId,
          guild_id: giveaway.guildId,
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
    }))
  );

  const winnerMentions = drawResult.winners
    .map((w) => (w.id ? `<@${w.id}>` : null))
    .filter((mention): mention is string => typeof mention === "string")
    .join(", ");

  const allowedMentionIds = drawResult.winners
    .map((w) => w.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  // Handle edge case where winners exist but none have valid IDs
  const announcementContent = winnerMentions
    ? await i18n.translate("giveaway.ended.with_winners", {
        language: locale,
        params: { prize: giveaway.prize, winners: winnerMentions },
      })
    : await i18n.translate("giveaway.ended.no_valid_winners", {
        language: locale,
        params: { prize: giveaway.prize },
      });

  await rest.post(Routes.channelMessages(giveaway.channelId), {
    body: {
      content: announcementContent,
      message_reference: {
        message_id: giveaway.messageId,
        channel_id: giveaway.channelId,
        guild_id: giveaway.guildId,
      },
      allowed_mentions: {
        users: allowedMentionIds,
        everyone: false,
        roles: [],
      },
    },
  });

  // Set cleanup alarm
  await ctx.state.storage.setAlarm(new Date(Date.now() + CLEANUP_DELAY));

  console.log("[alarm] end.success", {
    giveawayId,
    guildId: giveaway.guildId,
    winnersCount: drawResult.winners.length,
    r2Key: flushResult.object,
  });

  return {
    success: true,
    winners: drawResult.winners,
    object: flushResult.object,
  };
}
