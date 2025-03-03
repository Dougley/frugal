import { MessageBuilder, SlashCommandBuilder, SlashCommandStringOption } from '@discord-interactions/builders';
import { AutocompleteContext, ISlashCommand, SlashCommandContext } from '@discord-interactions/core';
import { PrismaClient, PrismaD1 } from '@dougley/d1-prisma';
import { EnvContext } from '../../env';

export class StopSlashCommand implements ISlashCommand {
  public builder = new SlashCommandBuilder('stop')
    .setDescription('Stop a running giveaway')
    .addStringOption(
      new SlashCommandStringOption('id', 'ID of the giveaway to stop').setRequired(true).setAutocomplete(true)
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
        value: g.message_id
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
        await ctx.edit(new MessageBuilder().setContent('That giveaway does not exist or has already expired.'));
        return;
      }

      // Update giveaway state to closed and trigger winner selection
      await stub.startAlarm.mutate(1);

      await ctx.edit(new MessageBuilder().setContent('Giveaway stopped successfully! Drawing winners...'));
    } catch (error) {
      console.error('Error in stop command:', error);
      await ctx.edit(
        new MessageBuilder().setContent(
          `Failed to stop giveaway: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  };
}
