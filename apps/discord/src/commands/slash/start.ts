import { createGiveawayComponents, JoinButton } from '@dougley/frugal-utils';
import {
  BitField,
  CommandContext,
  CommandOptionType,
  ComponentType,
  Message,
  MessageFlags,
  SlashCommand,
  SlashCreator
} from 'slash-create/web';
import { EnvContext } from '../../env';

// Constants for duration limits
const MAX_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const MIN_DURATION_MS = 10 * 1000; // 10 seconds

export default class StartCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'start',
      description: 'Start a giveaway in the current channel',
      options: [
        {
          type: CommandOptionType.STRING,
          name: 'duration',
          description: 'Duration of the giveaway (e.g., 30s, 5m, 2h, 1d)',
          required: true
        },
        {
          type: CommandOptionType.INTEGER,
          name: 'winners',
          description: 'Number of winners',
          required: true,
          min_value: 1,
          max_value: 50
        },
        {
          type: CommandOptionType.STRING,
          name: 'prize',
          description: 'Prize to win',
          required: true,
          min_length: 1,
          max_length: 100
        },
        {
          type: CommandOptionType.STRING,
          name: 'description',
          description: 'Description of the giveaway',
          required: false,
          min_length: 1,
          max_length: 1000
        }
      ]
    });
  }

  /**
   * Validates and parses a duration string (e.g., "30s", "5m", "2h", "1d")
   * Returns milliseconds if valid, or an error message if invalid
   */
  private validateDuration(durationStr: string): { valid: true; duration: number } | { valid: false; error: string } {
    // Parse the duration string into milliseconds
    const units: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000
    };

    const match = durationStr.match(/^(\d+)([smhd])$/);
    if (!match) {
      return {
        valid: false,
        error: 'Invalid duration format. Use format like: 30s, 5m, 2h, 1d'
      };
    }

    const [, value, unit] = match;
    const duration = parseInt(value, 10) * units[unit];

    // Validate the duration limits
    if (duration > MAX_DURATION_MS) {
      return {
        valid: false,
        error: "Giveaways can't be longer than 14 days"
      };
    }

    if (duration < MIN_DURATION_MS) {
      return {
        valid: false,
        error: "Giveaways can't be shorter than 10 seconds"
      };
    }

    return { valid: true, duration };
  }

  async run(ctx: CommandContext): Promise<any> {
    try {
      await ctx.defer();

      // Validate environment
      if (!EnvContext.env?.GIVEAWAY_STATE || !EnvContext.state) {
        return ctx.editOriginal('Giveaway state not available');
      }

      // Parse and validate duration
      const durationResult = this.validateDuration(ctx.options.duration);
      if (!durationResult.valid) {
        return ctx.editOriginal(durationResult.error);
      }

      // Process giveaway parameters
      const duration = durationResult.duration;
      const endTime = new Date(Date.now() + duration);
      const winnersCount = ctx.options.winners;
      const prize = ctx.options.prize;
      const description = ctx.options.description || '';

      // Host information
      const host = {
        id: ctx.user.id,
        username: ctx.user.username,
        avatar: ctx.user.avatar
      };

      // Create a new Durable Object ID for this giveaway
      const id = EnvContext.env.GIVEAWAY_STATE.newUniqueId();

      const flags = new BitField([MessageFlags.IS_COMPONENTS_V2, MessageFlags.SUPPRESS_EMBEDS]);

      const giveawayMessage = (await ctx.send({
        flags: flags.bitfield as number,
        allowedMentions: {
          parse: []
        },
        components: createGiveawayComponents({
          prize,
          winners: winnersCount,
          end_time: endTime,
          host_username: host.username,
          host_id: host.id,
          description,
          giveaway_id: id.toString(),
          join_button: JoinButton.createActionRow(id.toString())
        })
      })) as Message;

      // Ensure we have valid IDs
      const guildID = ctx.guildID ?? '0';
      const channelID = ctx.channelID ?? '0';

      if (!giveawayMessage || !giveawayMessage.id) {
        return ctx.editOriginal('Failed to create giveaway message');
      }

      // Get the durable object instance
      const stub = EnvContext.state.getInstance(EnvContext.env.GIVEAWAY_STATE, id);

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
        description: ctx.options.description || undefined
      };

      await stub.beginGiveaway.mutate(giveawayData);

      // Set up the alarm for when the giveaway ends
      await stub.startAlarm.mutate(endTime.toISOString());
    } catch (error) {
      console.error('Error in start command:', error);
      return ctx.editOriginal(`Failed to start giveaway: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

function generateDescription(description: string): import('slash-create/web').AnyComponent {
  return {
    type: ComponentType.CONTAINER,
    accent_color: 0x00ff00,
    components: [
      {
        type: ComponentType.TEXT_DISPLAY,
        content: `${description}`
      },
      {
        type: ComponentType.TEXT_DISPLAY,
        content: `-# Description provided by the host`
      }
    ]
  };
}
