import { CommandContext, SlashCommand, SlashCreator } from 'slash-create/web';
import { EnvContext } from '../../env';

interface GiveawayState {
  messageId: string;
  channelId: string;
  guildId: string;
  prize: string;
  winners: number;
  endTime: string;
  state: string;
  entryCount: number;
  durableObjectId: string;
  description: string | null;
  hostId: string;
}

export default class ListCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'list',
      description: 'Lists all giveaways in the server that are currently running'
    });
  }

  async run(ctx: CommandContext): Promise<any> {
    await ctx.defer();

    if (!EnvContext.env?.GIVEAWAY_STATE || !EnvContext.state) {
      return ctx.editOriginal('Giveaway state not available');
    }

    const currentGiveaways = await EnvContext.state
      .getInstance(EnvContext.env.GIVEAWAY_STATE, EnvContext.env.GIVEAWAY_STATE.newUniqueId())
      .getActiveGiveaways.query({
        guild_id: ctx.guildID ?? '0'
      });

    if (!currentGiveaways || currentGiveaways.length === 0) {
      return ctx.editOriginal('There are no giveaways running in this server.');
    }

    const description = currentGiveaways.map((giveaway: GiveawayState) => {
      const winners = giveaway.winners === 1 ? '1 winner' : `${giveaway.winners} winners`;
      const timestamp = Math.floor(new Date(giveaway.endTime).getTime() / 1000);
      return `[**${giveaway.prize}**](https://discord.com/channels/${ctx.guildID}/${giveaway.channelId}/${giveaway.messageId}) - ${winners} - Ends <t:${timestamp}:R> (<t:${timestamp}:F>)`;
    });

    return ctx.editOriginal({
      embeds: [
        {
          title: 'Giveaways currently running',
          description: description.join('\n'),
          color: 0x00ff00
        }
      ]
    });
  }
}
