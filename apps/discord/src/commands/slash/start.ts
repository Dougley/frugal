import { GiveawayState } from '@dougley/frugal-giveaways-do';
import {
  ButtonStyle,
  CommandContext,
  CommandOptionType,
  ComponentType,
  SlashCommand,
  SlashCreator
} from 'slash-create';
import { joinButtonRegistryCallback, leaveButtonRegistryCallback } from '../../components/buttons';
import { server } from '../../shim/servers/cfworker';
import { parseTime } from '../../utils/time';

export default class BotCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'start',
      description: 'Starts a giveaway in the current channel',
      options: [
        {
          type: CommandOptionType.STRING,
          name: 'duration',
          description: 'Duration of the giveaway',
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
          // @ts-expect-error - min_length and max_length are not in the typings
          min_length: 1,
          max_length: 100
        }
      ]
    });
    creator.registerGlobalComponent('joinButton', joinButtonRegistryCallback);
    creator.registerGlobalComponent('leaveButton', leaveButtonRegistryCallback);
  }

  async run(ctx: CommandContext) {
    await ctx.defer();
    const stub = GiveawayState.wrap(server.env!.GIVEAWAY_STATE);
    const id = server.env!.GIVEAWAY_STATE.newUniqueId();
    const state = stub.get(id);
    const duration = parseTime(ctx.options.duration);
    if (duration === 0) {
      return ctx.sendFollowUp({
        content: 'Invalid duration',
        ephemeral: true
      });
    }
    // a giveaway can't be longer than 14 days
    if (duration > 14 * 24 * 60 * 60 * 1000) {
      return ctx.sendFollowUp({
        content: "Giveaways can't be longer than 14 days",
        ephemeral: true
      });
    }
    // at minimum, a giveaway must be 1 minute long
    if (duration < 60 * 1000) {
      return ctx.sendFollowUp({
        content: "Giveaways can't be shorter than 1 minute",
        ephemeral: true
      });
    }
    const endDate = new Date(Date.now() + duration);
    const timestamp = (endDate.getTime() / 1000).toFixed(0);
    const msg = await ctx.sendFollowUp({
      content: 'Giveaway!',
      embeds: [
        {
          color: 0x00ff00,
          title: ctx.options.prize,
          description: `Winners: ${ctx.options.winners}\nEnds: <t:${timestamp}:R> (<t:${timestamp}:F>)`,
          timestamp: endDate.toISOString()
        }
      ],
      components: [
        {
          type: ComponentType.ACTION_ROW,
          components: [
            {
              type: ComponentType.BUTTON,
              style: ButtonStyle.PRIMARY,
              label: 'Enter!',
              custom_id: `joinButton`,
              emoji: {
                name: '🎉'
              }
            }
          ]
        }
      ]
    });
    state.class.setup({
      channel: ctx.channelID,
      guild: ctx.guildID,
      message: msg.id,
      winners: ctx.options.winners,
      prize: ctx.options.prize
    });
    await state.class.setAlarm(endDate.toISOString());
    await server.env!.KV.put(msg.id, id.toString(), {
      // expire keys in 3 months, consistent with summary expiration and DO expiration
      // 'expiration' expects a value in seconds since epoch
      expiration: Math.floor((Date.now() + 1000 * 60 * 60 * 24 * 30 * 3) / 1000)
    });
  }
}
