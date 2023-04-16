import { GiveawayState } from '@dougley/frugal-giveaways-do';
import {
  ButtonStyle,
  CommandContext,
  CommandOptionType,
  ComponentType,
  SlashCommand,
  SlashCreator
} from 'slash-create';
import { joinButtonRegistryCallback, leaveButtonRegistryCallback } from '../components/buttons';
import { server } from '../shim/servers/cfworker';

export default class BotCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'start',
      description: 'Starts a giveaway in the current channel',
      options: [
        {
          type: CommandOptionType.INTEGER,
          name: 'winners',
          description: 'Number of winners',
          required: true
        },
        {
          type: CommandOptionType.STRING,
          name: 'prize',
          description: 'Prize to win',
          required: true
        },
        {
          type: CommandOptionType.STRING,
          name: 'duration',
          description: 'Duration of the giveaway',
          required: true
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
    const msg = await ctx.sendFollowUp({
      content: 'Giveaway!',
      components: [
        {
          type: ComponentType.ACTION_ROW,
          components: [
            {
              type: ComponentType.BUTTON,
              style: ButtonStyle.PRIMARY,
              label: 'Enter',
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
    // for testing purposes, just end in 10 seconds
    await state.class.setAlarm(new Date(Date.now() + 10000).toISOString());
    await server.env!.KV.put(msg.id, id.toString());
  }
}
