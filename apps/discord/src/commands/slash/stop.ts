import { Schema, and, asc, eq } from '@dougley/frugal-drizzle/workers';
import { AutocompleteContext, CommandContext, CommandOptionType, SlashCreator } from 'slash-create/web';
import { BaseCommand } from '../../classes/BaseCommand';
import { EnvContext } from '../../env';

export default class StopCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'stop',
      description: 'Stop a running giveaway',
      options: [
        {
          type: CommandOptionType.STRING,
          name: 'id',
          description: 'ID of the giveaway to stop',
          required: true,
          autocomplete: true
        }
      ]
    });
  }

  async autocomplete(ctx: AutocompleteContext) {
    if (!EnvContext.env?.D1 || !EnvContext.drizzle) {
      return [];
    }

    // Get active giveaways for this guild, ordered by end time ascending
    const activeGiveaways = await EnvContext.drizzle
      .select()
      .from(Schema.giveaways)
      .where(and(eq(Schema.giveaways.guildId, ctx.guildID!), eq(Schema.giveaways.state, 'OPEN')))
      .orderBy(asc(Schema.giveaways.endTime))
      .limit(25); // Limit to 25 choices as per Discord's limits

    return activeGiveaways.map((g) => ({
      name: `${g.prize} (${g.winners} winner${g.winners > 1 ? 's' : ''})`,
      value: g.durableObjectId
    }));
  }

  async run(ctx: CommandContext) {
    await ctx.defer();

    if (!EnvContext.env?.GIVEAWAY_STATE || !EnvContext.state) {
      const errorMessage = await EnvContext.i18n!.translate('common.errors.giveaway_state_unavailable', {
        language: ctx.locale
      });
      return ctx.editOriginal(errorMessage!);
    }

    const giveawayId = ctx.options.id;
    console.log('Stopping giveaway:', giveawayId);

    const stub = EnvContext.state.getInstance(
      EnvContext.env.GIVEAWAY_STATE,
      EnvContext.env.GIVEAWAY_STATE.idFromString(giveawayId)
    );

    const state = await stub.getState.query();

    if (!state) {
      const errorMessage = await EnvContext.i18n!.translate('commands.stop.errors.giveaway_not_found', {
        language: ctx.locale
      });
      return ctx.editOriginal(errorMessage!);
    }

    // Update giveaway state to closed and trigger winner selection
    await stub.startAlarm.mutate(1);

    const successMessage = await EnvContext.i18n!.translate('commands.stop.messages.success', { language: ctx.locale });
    return ctx.editOriginal(successMessage!);
  }
}
