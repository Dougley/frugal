import { createGiveawayComponents, JoinButton } from "@dougley/frugal-utils";
import {
  BitField,
  type CommandContext,
  CommandOptionType,
  type Message,
  MessageFlags,
  type SlashCreator,
} from "slash-create/web";
import { BaseCommand } from "../../classes/BaseCommand";
import { EnvContext } from "../../env";

// Constants for duration limits
const MAX_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const MIN_DURATION_MS = 10 * 1000; // 10 seconds

export default class StartCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "start",
      description: "Start a giveaway in the current channel",
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
    locale: string
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

    const match = durationStr.match(/^(\d+)([smhd])$/);
    if (!match) {
      const error = await EnvContext.i18n!.translate(
        "commands.start.errors.invalid_duration_format",
        {
          language: locale,
        }
      );
      return {
        valid: false,
        error: error!,
      };
    }

    const [, value, unit] = match;
    const duration = parseInt(value, 10) * units[unit];

    // Validate the duration limits
    if (duration > MAX_DURATION_MS) {
      const error = await EnvContext.i18n!.translate(
        "commands.start.errors.duration_too_long",
        { language: locale }
      );
      return {
        valid: false,
        error: error!,
      };
    }

    if (duration < MIN_DURATION_MS) {
      const error = await EnvContext.i18n!.translate(
        "commands.start.errors.duration_too_short",
        { language: locale }
      );
      return {
        valid: false,
        error: error!,
      };
    }

    return { valid: true, duration };
  }

  async run(ctx: CommandContext) {
    try {
      await ctx.defer();

      // Validate environment
      if (!EnvContext.env?.GIVEAWAY_STATE || !EnvContext.state) {
        const errorMessage = await EnvContext.i18n!.translate(
          "common.errors.giveaway_state_unavailable",
          {
            language: ctx.locale,
          }
        );
        return ctx.editOriginal(errorMessage!);
      }

      // Parse and validate duration
      const durationResult = await this.validateDuration(
        ctx.options.duration,
        ctx.locale ?? "en-US"
      );
      if (!durationResult.valid) {
        return ctx.editOriginal(durationResult.error);
      }

      // Process giveaway parameters
      const duration = durationResult.duration;
      const endTime = new Date(Date.now() + duration);
      const winnersCount = ctx.options.winners;
      const prize = ctx.options.prize;
      const description = ctx.options.description || "";

      // Host information
      const host = {
        id: ctx.user.id,
        username: ctx.user.username,
        avatar: ctx.user.avatar,
      };

      // Create a new Durable Object ID for this giveaway
      const id = EnvContext.env.GIVEAWAY_STATE.newUniqueId();

      const flags = new BitField([
        MessageFlags.IS_COMPONENTS_V2,
        MessageFlags.SUPPRESS_EMBEDS,
      ]);

      const giveawayMessage = (await ctx.send({
        flags: flags.bitfield as number,
        allowedMentions: {
          parse: [],
        },
        components: createGiveawayComponents({
          prize,
          winners: winnersCount,
          end_time: endTime,
          host_username: host.username,
          host_id: host.id,
          description,
          giveaway_id: id.toString(),
          join_button: JoinButton.createActionRow(id.toString()),
        }),
      })) as Message;

      // Ensure we have valid IDs
      const guildID = ctx.guildID ?? "0";
      const channelID = ctx.channelID ?? "0";

      if (!giveawayMessage || !giveawayMessage.id) {
        const errorMessage = await EnvContext.i18n!.translate(
          "commands.start.errors.failed_to_create_message",
          {
            language: ctx.locale,
          }
        );
        return ctx.editOriginal(errorMessage!);
      }

      // Get the durable object instance
      const stub = EnvContext.state.getInstance(
        EnvContext.env.GIVEAWAY_STATE,
        id
      );

      // Start the giveaway
      const giveawayData = {
        message_id: giveawayMessage.id,
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

      await stub.beginGiveaway.mutate(giveawayData);

      // Set up the alarm for when the giveaway ends
      await stub.startAlarm.mutate(endTime.toISOString());
    } catch (error) {
      console.error("Error in start command:", error);
      const errorMessage = await EnvContext.i18n!.translate(
        "commands.start.errors.failed_to_start",
        {
          language: ctx.locale,
          params: {
            error: error instanceof Error ? error.message : String(error),
          },
        }
      );
      return ctx.editOriginal(errorMessage!);
    }
  }
}
