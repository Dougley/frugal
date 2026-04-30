import { TRPCClientError } from "@dougley/frugal-savestate";
import { FEATURE_LIMITS } from "@dougley/frugal-subscriptions";
import { createGiveawayComponents, JoinButton } from "@dougley/frugal-utils";
import * as Sentry from "@sentry/cloudflare";
import {
  BitField,
  type CommandContext,
  CommandOptionType,
  InteractionContextType,
  type Message,
  MessageFlags,
  type SlashCreator,
} from "slash-create/web";
import { BaseCommand } from "../../classes/BaseCommand";
import { getContext } from "../../context";
import { hasGiveawayManagerPermission } from "../../utils/giveaway-permissions";
import {
  getGiveawayTranslations,
  getJoinButtonTranslations,
} from "../../utils/giveaway-translations";

const MIN_DURATION_MS = 10 * 1000; // 10 seconds

export default class StartCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "start",
      description: "Start a giveaway in the current channel",
      contexts: [InteractionContextType.GUILD],
      options: [
        {
          type: CommandOptionType.STRING,
          name: "duration",
          description: "Duration of the giveaway (e.g., 30s, 5m, 2h, 1d)",
          required: true,
        },
        {
          type: CommandOptionType.INTEGER,
          name: "winners",
          description: "Number of winners",
          required: true,
          min_value: 1,
          max_value: 50,
        },
        {
          type: CommandOptionType.STRING,
          name: "prize",
          description: "Prize to win",
          required: true,
          min_length: 1,
          max_length: 100,
        },
        {
          type: CommandOptionType.STRING,
          name: "description",
          description: "Description of the giveaway",
          required: false,
          min_length: 1,
          max_length: 1000,
        },
      ],
    });
  }

  /**
   * Validates and parses a duration string (e.g., "30s", "5m", "2h", "1d").
   * Only checks format and minimum duration — max duration is enforced server-side.
   */
  private async validateDuration(
    durationStr: string,
    locale: string
  ): Promise<
    { valid: true; duration: number } | { valid: false; error: string }
  > {
    const units: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    const match = durationStr
      .trim()
      .toLowerCase()
      .match(/^(\d+)([smhd])$/);
    if (!match) {
      const error = await getContext().i18n?.translate(
        "commands.start.errors.invalid_duration_format",
        { language: locale }
      );
      return { valid: false, error };
    }

    const [, value, unit] = match;
    const duration = parseInt(value, 10) * units[unit];

    if (duration < MIN_DURATION_MS) {
      const error = await getContext().i18n?.translate(
        "commands.start.errors.duration_too_short",
        { language: locale }
      );
      return { valid: false, error };
    }

    return { valid: true, duration };
  }

  async run(ctx: CommandContext) {
    try {
      await ctx.defer();

      if (!ctx.guildID) {
        const errorMessage = await getContext().i18n.translate(
          "common.errors.guild_only",
          { language: ctx.locale }
        );
        return ctx.editOriginal(errorMessage);
      }

      if (!hasGiveawayManagerPermission(ctx)) {
        const errorMessage = await getContext().i18n.translate(
          "common.errors.manage_required",
          { language: ctx.locale }
        );
        return ctx.editOriginal(errorMessage);
      }

      if (!getContext().env?.GIVEAWAY_STATE || !getContext().state) {
        const errorMessage = await getContext().i18n?.translate(
          "common.errors.giveaway_state_unavailable",
          { language: ctx.locale }
        );
        return ctx.editOriginal(errorMessage);
      }

      const locale = ctx.locale ?? "en-US";

      const durationResult = await this.validateDuration(
        ctx.options.duration,
        locale
      );
      if (!durationResult.valid) {
        return ctx.editOriginal(durationResult.error);
      }

      const duration = durationResult.duration;
      const endTime = new Date(Date.now() + duration);
      const winnersCount = ctx.options.winners;
      const prize = ctx.options.prize;
      const description = ctx.options.description || "";

      const host = {
        id: ctx.user.id,
        username: ctx.user.username,
        avatar: ctx.user.avatar,
      };

      const id = getContext().env.GIVEAWAY_STATE.newUniqueId();

      const flags = new BitField([
        MessageFlags.IS_COMPONENTS_V2,
        MessageFlags.SUPPRESS_EMBEDS,
      ]);

      const guildID = ctx.guildID;
      const channelID = ctx.channelID ?? "0";

      const stub = getContext().state.getInstance(
        getContext().env.GIVEAWAY_STATE,
        id
      );

      const debugContext = {
        giveawayId: id.toString(),
        guildId: guildID,
        channelId: channelID,
        userId: ctx.user.id,
      };

      // Reserve a slot and enforce premium limits before sending the message.
      // FORBIDDEN errors (winners/duration over plan) surface here before any
      // Discord message is created, avoiding orphan messages.
      await stub.reserveSlot.mutate({
        guild_id: guildID,
        host_id: host.id,
        winners: winnersCount,
        end_time: endTime.toISOString(),
      });

      let giveawayMessageId: string;

      const [giveawayTranslations, joinButtonTranslations] = await Promise.all([
        getGiveawayTranslations(locale, {
          participants: 0,
          winners: winnersCount,
        }),
        getJoinButtonTranslations(locale),
      ]);

      try {
        const giveawayMessage = (await ctx.send({
          flags: flags.bitfield as number,
          allowedMentions: { parse: [] },
          components: createGiveawayComponents({
            prize,
            end_time: endTime,
            host_username: host.username,
            host_id: host.id,
            description,
            giveaway_id: id.toString(),
            join_button: JoinButton.createActionRow(
              id.toString(),
              joinButtonTranslations
            ),
            translations: giveawayTranslations,
          }),
        })) as Message;

        if (!giveawayMessage?.id) {
          const errorMessage = await getContext().i18n?.translate(
            "commands.start.errors.failed_to_create",
            { language: ctx.locale }
          );

          try {
            await stub.releaseSlot.mutate();
          } catch (releaseError) {
            console.warn(
              "[start] releaseSlot failed after missing message id",
              {
                ...debugContext,
                error:
                  releaseError instanceof Error
                    ? releaseError.message
                    : String(releaseError),
              }
            );
            Sentry.captureException(releaseError);
          }

          return ctx.editOriginal(errorMessage);
        }

        giveawayMessageId = giveawayMessage.id;
      } catch (error) {
        console.warn("[start] message.create.failed; releasing slot", {
          ...debugContext,
          error: error instanceof Error ? error.message : String(error),
        });

        await stub.releaseSlot.mutate();
        throw error;
      }

      const giveawayData = {
        message_id: giveawayMessageId,
        channel_id: channelID,
        guild_id: guildID,
        prize,
        winners: winnersCount,
        end_time: endTime.toISOString(),
        host_id: ctx.user.id,
        host_username: ctx.user.username,
        host_avatar: ctx.user.avatar || undefined,
        description: ctx.options.description || undefined,
      };

      try {
        await stub.beginGiveaway.mutate(giveawayData);
        await stub.startAlarm.mutate(endTime.toISOString());
      } catch (error) {
        console.warn("[start] begin/start failed; releasing slot", {
          ...debugContext,
          messageId: giveawayMessageId,
          error: error instanceof Error ? error.message : String(error),
        });

        await stub.releaseSlot.mutate();
        throw error;
      }
    } catch (error) {
      console.error("Error in start command:", error);

      if (error instanceof TRPCClientError) {
        if (
          error.data?.code === "PRECONDITION_FAILED" &&
          error.message === "CONCURRENT_LIMIT_EXCEEDED"
        ) {
          const errorMessage = await getContext().i18n.translate(
            "commands.start.errors.concurrent_limit",
            {
              language: ctx.locale,
              params: {
                max: FEATURE_LIMITS.CONCURRENT_GIVEAWAYS.FREE.toString(),
                premiumMax:
                  FEATURE_LIMITS.CONCURRENT_GIVEAWAYS.PREMIUM.toString(),
              },
            }
          );
          return ctx.editOriginal(errorMessage);
        }

        if (error.data?.code === "FORBIDDEN") {
          if (error.message === "PREMIUM_WINNERS_LIMIT") {
            const errorMessage = await getContext().i18n.translate(
              "premium.upsell.more_winners",
              {
                language: ctx.locale,
                params: {
                  premiumMax: FEATURE_LIMITS.MAX_WINNERS.PREMIUM.toString(),
                },
              }
            );
            return ctx.editOriginal(errorMessage);
          }

          if (error.message === "PREMIUM_DURATION_LIMIT") {
            const errorMessage = await getContext().i18n.translate(
              "premium.upsell.longer_duration",
              {
                language: ctx.locale,
                params: {
                  premiumMax:
                    FEATURE_LIMITS.GIVEAWAY_DURATION_DAYS.PREMIUM.toString(),
                },
              }
            );
            return ctx.editOriginal(errorMessage);
          }
        }
      }

      const eventId = Sentry.captureException(error);

      const errorMessage = await getContext().i18n.translate(
        "commands.start.errors.failed_to_start",
        {
          language: ctx.locale,
          params: { eventId },
        }
      );
      return ctx.editOriginal(errorMessage);
    }
  }
}
