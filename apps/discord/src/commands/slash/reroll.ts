import { Schema, and, eq } from '@dougley/frugal-drizzle/workers';
import { AutocompleteContext, CommandContext, CommandOptionType, SlashCommand, SlashCreator } from 'slash-create/web';
import { EnvContext } from '../../env';

interface WinnerInfo {
  id: string | null;
  username: string | null;
  discriminator: string;
  avatar: string | null;
}

export default class RerollCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'reroll',
      description: 'Reroll a giveaway',
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
    if (!EnvContext.env?.D1 || !EnvContext.drizzle) {
      return [];
    }

    if (!ctx.guildID) return [];

    // Use string keys to match DB columns
    const closedGiveaways = await EnvContext.drizzle
      .select()
      .from(Schema.giveaways)
      .where(and(eq(Schema.giveaways.guildId, ctx.guildID), eq(Schema.giveaways.state, 'CLOSED')))
      .orderBy(Schema.giveaways.endTime)
      .limit(25);

    return closedGiveaways.map((g) => ({
      name: `${g.prize} (${g.winners} winner${g.winners > 1 ? 's' : ''})`,
      value: g.durableObjectId
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

    // Helper to coerce winner fields to string|null
    const mapWinners = (winners: any[]): WinnerInfo[] =>
      winners.map((w) => ({
        id: w.id != null ? String(w.id) : null,
        username: w.username != null ? String(w.username) : null,
        discriminator: w.discriminator != null ? String(w.discriminator) : '',
        avatar: w.avatar != null ? String(w.avatar) : null
      }));

    // If count is specified, perform a partial reroll
    if (count) {
      const result = await stub.drawWinners.mutate(count);

      if (!result.success || !result.winners || result.winners.length === 0) {
        return ctx.editOriginal('No new winners could be drawn, as there were no (other) entries.');
      }

      const winners = mapWinners(result.winners);
      const winnerMentions = winners
        .map((winner) => (winner.id ? `<@${winner.id}>` : null))
        .filter(Boolean)
        .join(', ');
      const allowedMentionIds = winners.map((w) => w.id).filter((id): id is string => typeof id === 'string');

      return ctx.editOriginal({
        content:
          `🎉 ${winners.length === 1 ? 'A new winner has' : `${winners.length} new winners have`} been drawn!\n` +
          `Congratulations to ${winnerMentions}!`,
        allowedMentions: {
          users: allowedMentionIds,
          everyone: false,
          roles: []
        }
      });
    } else {
      const result = await stub.drawWinners.mutate();

      if (!result.success || !result.winners || result.winners.length === 0) {
        return ctx.editOriginal('No new winners could be drawn, as there were no (other) entries.');
      }

      const winners = mapWinners(result.winners);
      const winnerMentions = winners
        .map((winner) => (winner.id ? `<@${winner.id}>` : null))
        .filter(Boolean)
        .join(', ');
      const allowedMentionIds = winners.map((w) => w.id).filter((id): id is string => typeof id === 'string');

      return ctx.editOriginal({
        content:
          `🎉 New ${winners.length === 1 ? 'winner has' : 'winners have'} been drawn!\n` +
          `Congratulations to ${winnerMentions}!`,
        allowedMentions: {
          users: allowedMentionIds,
          everyone: false,
          roles: []
        }
      });
    }
  }
}
