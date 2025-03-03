import { ActionRowBuilder, MessageBuilder, SlashCommandBuilder, SlashCommandStringOption } from '@discord-interactions/builders';
import { AutocompleteContext, ISlashCommand, SlashCommandContext } from '@discord-interactions/core';
import { PrismaClient, PrismaD1 } from '@dougley/d1-prisma';
import { EnvContext } from '../../env';

export class EditSlashCommand implements ISlashCommand {
  public builder = new SlashCommandBuilder('edit')
    .setDescription('Edit a giveaway')
    .addStringOption(
      new SlashCommandStringOption('id', 'ID of the giveaway to edit').setRequired(true).setAutocomplete(true)
    );

  public autocompleteHandler = async (ctx: AutocompleteContext): Promise<void> => {
    if (!EnvContext.env?.D1) {
      await ctx.reply([]);
      return;
    }
    const prisma = new PrismaClient({ adapter: new PrismaD1(EnvContext.env.D1) });

    // Get active giveaways for this guild, ordered by end time ascending
    const giveaways = await prisma.giveaways.findMany({
      where: {
        guild_id: ctx.guildId,
        state: 'ACTIVE'
      },
      orderBy: {
        end_time: 'asc'
      },
      take: 25 // Limit to 25 choices as per Discord's limits
    });

    await ctx.reply(
      giveaways.map((g) => ({
        name: `${g.prize} (${g.winners} winner${g.winners > 1 ? 's' : ''})`,
        value: g.durable_object_id
      }))
    );
  };

  public handler = async (ctx: SlashCommandContext): Promise<void> => {
    await ctx.defer();

    if (!EnvContext.env?.GIVEAWAY_STATE || !EnvContext.state) {
      await ctx.edit(new MessageBuilder().setContent('Giveaway state not available'));
      return;
    }

    const giveawayId = ctx.getStringOption('id').value;

    try {
      const stub = EnvContext.state.getInstance(
        EnvContext.env.GIVEAWAY_STATE,
        EnvContext.env.GIVEAWAY_STATE.idFromString(giveawayId)
      );

      const state = await stub.getState.query();
      if (!state) {
        await ctx.edit(new MessageBuilder().setContent('That giveaway does not exist or has expired.'));
        return;
      }

      // TODO: Add modal support once available in new framework
      // For now, we'll just show the current state
      await ctx.edit(
        new MessageBuilder().setContent(
          `**Current Giveaway State**\n` +
            `🎁 **Prize:** ${state.prize}\n` +
            `👥 **Winners:** ${state.winners}\n` +
            `⏱️ **End Time:** ${new Date(state.end_time).toLocaleString()}\n` +
            `\nModal support for editing will be added once available in the framework.`
        )
      );
    } catch (error) {
      console.error('Error in edit command:', error);
      await ctx.edit(
        new MessageBuilder().setContent(
          `Failed to edit giveaway: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  };
}
