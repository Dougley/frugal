import { EmbedBuilder, MessageBuilder, SlashCommandBuilder } from '@discord-interactions/builders';
import { ISlashCommand, SlashCommandContext } from '@discord-interactions/core';
import { EnvContext } from '../../env';

interface GiveawayState {
  message_id: string;
  channel_id: string;
  prize: string;
  winners: number;
  end_time: Date;
  state: string;
}

export class ListSlashCommand implements ISlashCommand {
  public builder = new SlashCommandBuilder('list').setDescription(
    'Lists all giveaways in the server that are currently running'
  );

  public handler = async (ctx: SlashCommandContext): Promise<void> => {
    await ctx.defer();

    if (!EnvContext.env?.GIVEAWAY_STATE || !EnvContext.state) {
      await ctx.edit(new MessageBuilder().setContent('Giveaway state not available'));
      return;
    }

    try {
      const currentGiveaways = await EnvContext.state
        .getInstance(EnvContext.env.GIVEAWAY_STATE, EnvContext.env.GIVEAWAY_STATE.newUniqueId())
        .getActiveGiveaways.query({
          guild_id: ctx.guildId ?? '0'
        });

      if (!currentGiveaways || currentGiveaways.length === 0) {
        await ctx.edit(new MessageBuilder().setContent('There are no giveaways running in this server.'));
        return;
      }

      const description = currentGiveaways.map((giveaway: GiveawayState) => {
        const winners = giveaway.winners === 1 ? '1 winner' : `${giveaway.winners} winners`;
        const timestamp = Math.floor(new Date(giveaway.end_time).getTime() / 1000);
        return `[**${giveaway.prize}**](https://discord.com/channels/${ctx.guildId}/${giveaway.channel_id}/${giveaway.message_id}) - ${winners} - Ends <t:${timestamp}:R> (<t:${timestamp}:F>)`;
      });

      const embed = new EmbedBuilder()
        .setTitle('Giveaways currently running')
        .setDescription(description.join('\n'))
        .setColor(0x00ff00);

      await ctx.edit(new MessageBuilder().addEmbeds(embed));
    } catch (error) {
      console.error('Error in list command:', error);
      await ctx.edit(
        new MessageBuilder().setContent(
          `Failed to list giveaways: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  };
}
