import { PrismaClient, PrismaD1 } from '@dougley/d1-prisma';
import { AutocompleteContext, CommandContext, CommandOptionType, SlashCommand, SlashCreator } from 'slash-create/web';
import { EnvContext } from '../../env';

interface WinnerInfo {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
}

export default class RerollCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'reroll',
      description: 'Reroll winners for an ended giveaway',
      options: [
        {
          type: CommandOptionType.STRING,
          name: 'id',
          description: 'ID of the giveaway to reroll',
          required: true,
          autocomplete: true
        },
        {
          type: CommandOptionType.INTEGER,
          name: 'count',
          description: 'Number of winners to reroll (defaults to all)',
          required: false,
          min_value: 1
        }
      ]
    });
  }

  async autocomplete(ctx: AutocompleteContext) {
    if (!EnvContext.env?.D1) {
      return [];
    }

    const prisma = new PrismaClient({ adapter: new PrismaD1(EnvContext.env.D1) });

    // Get closed giveaways for this guild, ordered by end time descending
    const giveaways = await prisma.giveaways.findMany({
      where: {
        guild_id: ctx.guildID,
        state: 'CLOSED'
      },
      orderBy: {
        end_time: 'desc'
      },
      take: 25 // Limit to 25 choices as per Discord's limits
    });

    return giveaways.map((g) => ({
      name: `${g.prize} (${g.winners} winner${g.winners > 1 ? 's' : ''})`,
      value: g.durable_object_id
    }));
  }

  async run(ctx: CommandContext): Promise<any> {
    await ctx.defer();

    if (!EnvContext.env?.GIVEAWAY_STATE || !EnvContext.state) {
      return ctx.editOriginal('Giveaway state not available');
    }

    const giveawayId = ctx.options.id;
    const count = ctx.options.count;

    const stub = EnvContext.state.getInstance(
      EnvContext.env.GIVEAWAY_STATE,
      EnvContext.env.GIVEAWAY_STATE.idFromString(giveawayId)
    );

    const state = await stub.getState.query();

    if (!state) {
      return ctx.editOriginal('That giveaway does not exist.');
    }

    if (state.state !== 'CLOSED') {
      return ctx.editOriginal(
        "That giveaway is still running. You can't reroll it until it ends. Try stopping it first."
      );
    }

    // If count is specified, perform a partial reroll
    if (count) {
      // Use the tRPC route for custom reroll
      const result = await stub.drawWinners.mutate(count);

      if (!result.success || result.winners.length === 0) {
        return ctx.editOriginal('No new winners could be drawn, as there were no (other) entries.');
      }

      const winnerMentions = result.winners.map((winner: WinnerInfo) => `<@${winner.id}>`).join(', ');

      return ctx.editOriginal({
        content:
          `🎉 ${result.winners.length === 1 ? 'A new winner has' : `${result.winners.length} new winners have`} been drawn!\n` +
          `Congratulations to ${winnerMentions}!`,
        allowedMentions: {
          users: result.winners.map((w: WinnerInfo) => w.id),
          everyone: false,
          roles: []
        }
      });
    } else {
      // Draw new winners (reroll all)
      const result = await stub.drawWinners.mutate();

      if (!result.success || result.winners.length === 0) {
        return ctx.editOriginal('No new winners could be drawn, as there were no (other) entries.');
      }

      const winnerMentions = result.winners.map((winner: WinnerInfo) => `<@${winner.id}>`).join(', ');

      return ctx.editOriginal({
        content:
          `🎉 New ${result.winners.length === 1 ? 'winner has' : 'winners have'} been drawn!\n` +
          `Congratulations to ${winnerMentions}!`,
        allowedMentions: {
          users: result.winners.map((w: WinnerInfo) => w.id),
          everyone: false,
          roles: []
        }
      });
    }
  }
}
