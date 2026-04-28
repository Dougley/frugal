import { TRPCClientError } from "@dougley/frugal-savestate";
import type { SubscriptionStatus } from "@dougley/frugal-subscriptions";
import {
  checkFeatureLimit,
  FEATURE_LIMITS,
} from "@dougley/frugal-subscriptions";
import {
  createGiveawayComponents,
  type GiveawayTranslations,
  JoinButton,
  type JoinButtonTranslations,
} from "@dougley/frugal-utils";
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

// Constants for duration limits
const MIN_DURATION_MS = 10 * 1000; // 10 seconds

/**
 * Helper to get giveaway translations from i18n
 *
 * @param locale - The locale to translate to
 * @param counts - The counts for pluralized strings
 */
async function getGiveawayTranslations(
  locale: string,
  counts: { participants: number; winners: number }
): Promise<GiveawayTranslations> {
  const { i18n } = getContext();
  const [
    title,
    titleEnded,
    winners,
    ends,
    ended,
    hostedBy,
    descriptionNote,
    prize,
    entries,
    enterCta,
    participants,
    winnerCount,
  ] = await Promise.all([
    i18n.translate("giveaway.embed.title", { language: locale }),
    i18n.translate("giveaway.embed.title_ended", { language: locale }),
    i18n.translate("giveaway.embed.winners", { language: locale }),
    i18n.translate("common.labels.ends", { language: locale }),
    i18n.translate("common.labels.ended", { language: locale }),
    i18n.translate("giveaway.embed.hosted_by", { language: locale }),
    i18n.translate("giveaway.embed.description_note", { language: locale }),
    i18n.translate("giveaway.embed.prize", { language: locale }),
    i18n.translate("giveaway.embed.entries", { language: locale }),
    i18n.translate("giveaway.embed.enter_cta", { language: locale }),
    i18n.translate("common.labels.participants", {
      language: locale,
      params: { count: counts.participants },
    }),
    i18n.translate("common.labels.winners", {
      language: locale,
      params: { count: counts.winners },
    }),
  ]);

  return {
    title,
    titleEnded,
    winners,
    ends,
    ended,
    hostedBy,
    descriptionNote,
    prize,
    entries,
    enterCta,
    participants,
    winnerCount,
  };
}

/**
 * Helper to get join button translations from i18n
 */
async function getJoinButtonTranslations(
  locale: string
): Promise<JoinButtonTranslations> {
  const { i18n } = getContext();
  const label = await i18n.translate("components.join_button.label", {
    language: locale,
  });
  return { label };
}

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
   * Validates and parses a duration string (e.g., "30s", "5m", "2h", "1d")
   * Returns milliseconds if valid, or an error message if invalid
   */
  private async validateDuration(
    durationStr: string,
    locale: string,
    subscription: SubscriptionStatus
  ): Promise<
    { valid: true; duration: number } | { valid: false; error: string }
  > {
    // Parse the duration string into milliseconds
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
        {
          language: locale,
        }
      );
      return {
        valid: false,
        error: error,
      };
    }

    const [, value, unit] = match;
    const duration = parseInt(value, 10) * units[unit];

    // Validate the duration limits
    const maxDays = subscription.hasPremium
      ? FEATURE_LIMITS.GIVEAWAY_DURATION_DAYS.PREMIUM
      : FEATURE_LIMITS.GIVEAWAY_DURATION_DAYS.FREE;
    const maxDurationMs = maxDays * 24 * 60 * 60 * 1000;

    if (duration > maxDurationMs) {
      const error = await getContext().i18n.translate(
        "commands.start.errors.duration_too_long",
        {
          language: locale,
          params: {
            maxDays: maxDays.toString(),
          },
        }
      );
      return {
        valid: false,
        error: error,
      };
    }

    if (duration < MIN_DURATION_MS) {
      const error = await getContext().i18n?.translate(
        "commands.start.errors.duration_too_short",
        { language: locale }
      );
      return {
        valid: false,
        error: error,
      };
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

      // Validate environment
      if (!getContext().env?.GIVEAWAY_STATE || !getContext().state) {
        const errorMessage = await getContext().i18n?.translate(
          "common.errors.giveaway_state_unavailable",
          {
            language: ctx.locale,
          }
        );
        return ctx.editOriginal(errorMessage);
      }

      const subscription = await this.getPremiumStatus(ctx);

      // Parse and validate duration
      const durationResult = await this.validateDuration(
        ctx.options.duration,
        ctx.locale ?? "en-US",
        subscription
      );
      if (!durationResult.valid) {
        return ctx.editOriginal(durationResult.error);
      }

      // Process giveaway parameters
      const duration = durationResult.duration;
      const endTime = new Date(Date.now() + duration);
      const winnersCount = ctx.options.winners;

      const winnersLimit = checkFeatureLimit(
        subscription,
        winnersCount,
        FEATURE_LIMITS.MAX_WINNERS.FREE,
        FEATURE_LIMITS.MAX_WINNERS.PREMIUM
      );

      if (!winnersLimit.allowed) {
        const error = await getContext().i18n.translate(
          "commands.start.errors.winners_too_many",
          {
            language: ctx.locale,
            params: {
              max: winnersLimit.effectiveLimit.toString(),
              premiumMax: FEATURE_LIMITS.MAX_WINNERS.PREMIUM.toString(),
            },
          }
        );

        return ctx.editOriginal(error);
      }

      const prize = ctx.options.prize;
      const description = ctx.options.description || "";

      // Host information
      const host = {
        id: ctx.user.id,
        username: ctx.user.username,
        avatar: ctx.user.avatar,
      };

      // Create a new Durable Object ID for this giveaway
      const id = getContext().env.GIVEAWAY_STATE.newUniqueId();

      const flags = new BitField([
        MessageFlags.IS_COMPONENTS_V2,
        MessageFlags.SUPPRESS_EMBEDS,
      ]);

      // Ensure we have valid IDs
      const guildID = ctx.guildID;
      const channelID = ctx.channelID ?? "0";

      // Get the durable object instance
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

      // Reserve a slot before creating the giveaway message.
      // This prevents orphan messages when the guild is at limit.
      await stub.reserveSlot.mutate({ guild_id: guildID });

      let giveawayMessageId: string;

      // Get translations for the giveaway components
      const locale = ctx.locale ?? "en-US";
      const [giveawayTranslations, joinButtonTranslations] = await Promise.all([
        getGiveawayTranslations(locale, {
          participants: 0, // New giveaway starts with 0 participants
          winners: winnersCount,
        }),
        getJoinButtonTranslations(locale),
      ]);

      try {
        const giveawayMessage = (await ctx.send({
          flags: flags.bitfield as number,
          allowedMentions: {
            parse: [],
          },
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

        if (!giveawayMessage || !giveawayMessage.id) {
          const errorMessage = await getContext().i18n?.translate(
            "commands.start.errors.failed_to_create",
            {
              language: ctx.locale,
            }
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

      // Start the giveaway
      const giveawayData = {
        message_id: giveawayMessageId,
        channel_id: channelID,
        guild_id: guildID,
        prize: prize,
        winners: winnersCount,
        end_time: endTime.toISOString(),
        host_id: ctx.user.id,
        host_username: ctx.user.username,
        host_avatar: ctx.user.avatar || undefined,
        description: ctx.options.description || undefined,
      };

      try {
        await stub.beginGiveaway.mutate(giveawayData);

        // Set up the alarm for when the giveaway ends
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

      if (
        error instanceof TRPCClientError &&
        error.data.code === "PRECONDITION_FAILED" &&
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

      Sentry.captureException(error);

      const errorMessage = await getContext().i18n.translate(
        "commands.start.errors.failed_to_start",
        {
          language: ctx.locale,
          params: {
            error: error instanceof Error ? error.message : String(error),
          },
        }
      );
      return ctx.editOriginal(errorMessage);
    }
  }
}
