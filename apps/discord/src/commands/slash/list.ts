import { CommandContext, SlashCreator } from 'slash-create/web';
import { BaseCommand } from '../../classes/BaseCommand';
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

export default class ListCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'list',
      description: 'Lists all giveaways in the server that are currently running'
    });
  }

  async run(ctx: CommandContext) {
    await ctx.defer();

    if (!EnvContext.env?.GIVEAWAY_STATE || !EnvContext.state) {
      const errorMessage = await EnvContext.i18n!.translate('common.errors.giveaway_state_unavailable', {
        language: ctx.locale
      });
      return ctx.editOriginal(errorMessage!);
    }

    const currentGiveaways = await EnvContext.state
      .getInstance(EnvContext.env.GIVEAWAY_STATE, EnvContext.env.GIVEAWAY_STATE.newUniqueId())
      .getActiveGiveaways.query({
        guild_id: ctx.guildID ?? '0'
      });

    if (!currentGiveaways || currentGiveaways.length === 0) {
      const noGiveawaysMessage = await EnvContext.i18n!.translate('commands.list.messages.no_giveaways', {
        language: ctx.locale
      });
      return ctx.editOriginal(noGiveawaysMessage!);
    }

    const description = await Promise.all(
      currentGiveaways.map(async (giveaway: GiveawayState) => {
        const winnersText = await EnvContext.i18n!.translate(
          giveaway.winners === 1 ? 'common.winner_singular' : 'common.winners_plural',
          {
            language: ctx.locale,
            params: { count: giveaway.winners.toString() }
          }
        );
        const timestamp = Math.floor(new Date(giveaway.endTime).getTime() / 1000);
        const endsText = await EnvContext.i18n!.translate('common.ends', { language: ctx.locale });
        return `[**${giveaway.prize}**](https://discord.com/channels/${ctx.guildID}/${giveaway.channelId}/${giveaway.messageId}) - ${winnersText} - ${endsText} <t:${timestamp}:R> (<t:${timestamp}:F>)`;
      })
    );

    const title = await EnvContext.i18n!.translate('commands.list.messages.title', { language: ctx.locale });
    return ctx.editOriginal({
      embeds: [
        {
          title: title!,
          description: description.join('\n'),
          color: 0x00ff00
        }
      ]
    });
  }
}
