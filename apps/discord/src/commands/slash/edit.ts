import { Schema, and, asc, eq } from '@dougley/frugal-drizzle/workers';
import { EditModal } from '@dougley/frugal-utils';
import { AutocompleteContext, CommandContext, CommandOptionType, SlashCreator } from 'slash-create/web';
import { BaseCommand } from '../../classes/BaseCommand';
import { EnvContext } from '../../env';

export default class EditCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'edit',
      description: 'Edit a giveaway',
      options: [
        {
          type: CommandOptionType.STRING,
          name: 'id',
          description: 'ID of the giveaway to edit',
          required: true,
          autocomplete: true
        }
      ]
    });
  }

  async autocomplete(ctx: AutocompleteContext) {
    console.log('Autocomplete called');

    if (!EnvContext.env?.D1 || !EnvContext.drizzle) {
      console.error('D1 environment not available');
      return [];
    }

    // Get active giveaways for this guild, ordered by end time ascending
    const activeGiveaways = await EnvContext.drizzle
      .select()
      .from(Schema.giveaways)
      .where(and(eq(Schema.giveaways.guildId, ctx.guildID!), eq(Schema.giveaways.state, 'OPEN')))
      .orderBy(asc(Schema.giveaways.endTime))
      .limit(25); // Limit to 25 choices as per Discord's limits

    console.log('Giveaways:', activeGiveaways);
    // dd-mm-yyyy hh:mm:ss
    const datestr = (date: Date) => {
      return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    };

    return activeGiveaways.map((g) => ({
      name: `${g.prize.slice(
        0,
        20
      )} - Ends ${datestr(new Date(g.endTime))} with ${g.winners} winner${g.winners === 1 ? '' : 's'}`,
      value: g.durableObjectId
    }));
  }

  async run(ctx: CommandContext): Promise<any> {
    // No need to defer the response as we're showing a modal immediately

    if (!EnvContext.env?.GIVEAWAY_STATE || !EnvContext.state) {
      const errorMessage = await EnvContext.i18n!.translate('common.errors.giveaway_state_unavailable', {
        language: ctx.locale
      });
      return ctx.send({
        content: errorMessage!,
        ephemeral: true
      });
    }

    const giveawayId = ctx.options.id;

    const stub = EnvContext.state.getInstance(
      EnvContext.env.GIVEAWAY_STATE,
      EnvContext.env.GIVEAWAY_STATE.idFromString(giveawayId)
    );

    const state = await stub.getState.query();

    if (!state) {
      const errorMessage = await EnvContext.i18n!.translate('commands.edit.errors.giveaway_not_found', {
        language: ctx.locale
      });
      return ctx.send({
        content: errorMessage!,
        ephemeral: true
      });
    }

    // Show the modal immediately using the component's createModal method
    return ctx.sendModal(EditModal.createModal(giveawayId, state));
  }
}
