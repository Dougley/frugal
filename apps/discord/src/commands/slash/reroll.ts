import { MessageBuilder, SlashCommandBuilder, SlashCommandStringOption } from '@discord-interactions/builders';
import { AutocompleteContext, ISlashCommand, SlashCommandContext } from '@discord-interactions/core';
import { PrismaClient, PrismaD1 } from '@dougley/d1-prisma';
import { EnvContext } from '../../env';

interface WinnerInfo {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
}

export class RerollSlashCommand implements ISlashCommand {
  public builder = new SlashCommandBuilder('reroll')
    .setDescription('Reroll winners for an ended giveaway')
    .addStringOption(
      new SlashCommandStringOption('id', 'ID of the giveaway to reroll').setRequired(true).setAutocomplete(true)
    );

  public autocompleteHandler = async (ctx: AutocompleteContext): Promise<void> => {
    if (!EnvContext.env?.D1) {
      await ctx.reply([]);
      return;
    }
    const prisma = new PrismaClient({ adapter: new PrismaD1(EnvContext.env.D1) });

    // Get closed giveaways for this guild, ordered by end time descending
    const giveaways = await prisma.giveaways.findMany({
      where: {
        guild_id: ctx.guildId,
        state: 'CLOSED'
      },
      orderBy: {
        end_time: 'desc'
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
        await ctx.edit(new MessageBuilder().setContent('That giveaway does not exist.'));
        return;
      }

      if (state.state !== 'CLOSED') {
        await ctx.edit(
          new MessageBuilder().setContent(
            "That giveaway is still running. You can't reroll it until it ends. Try stopping it first."
          )
        );
        return;
      }

      // Draw new winners
      const result = await stub.drawWinners.mutate();
      if (!result.success || result.winners.length === 0) {
        await ctx.edit(
          new MessageBuilder().setContent('No new winners could be drawn, as there were no (other) entries.')
        );
        return;
      }

      const winnerMentions = result.winners.map((winner) => `<@${winner.id}>`).join(', ');
      await ctx.edit(
        new MessageBuilder()
          .setContent(
            `🎉 New ${result.winners.length === 1 ? 'winner has' : 'winners have'} been drawn!\n` +
              `Congratulations to ${winnerMentions}!`
          )
          .setAllowedMentions({ users: result.winners.map((w) => w.id) })
      );
    } catch (error) {
      console.error('Error in reroll command:', error);
      await ctx.edit(
        new MessageBuilder().setContent(
          `Failed to reroll giveaway: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  };
}
