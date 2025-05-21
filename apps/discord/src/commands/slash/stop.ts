import { PrismaClient, PrismaD1 } from '@dougley/d1-prisma';
import { AutocompleteContext, CommandContext, CommandOptionType, SlashCommand, SlashCreator } from 'slash-create/web';
import { EnvContext } from '../../env';

export default class StopCommand extends SlashCommand {
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
    if (!EnvContext.env?.D1) {
      return [];
    }

    const prisma = new PrismaClient({ adapter: new PrismaD1(EnvContext.env.D1) });

    // Get active giveaways for this guild, ordered by end time ascending
    const giveaways = await prisma.giveaways.findMany({
      where: {
        guild_id: ctx.guildID,
        state: 'OPEN'
      },
      orderBy: {
        end_time: 'asc'
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
    console.log('Stopping giveaway:', giveawayId);

    const stub = EnvContext.state.getInstance(
      EnvContext.env.GIVEAWAY_STATE,
      EnvContext.env.GIVEAWAY_STATE.idFromString(giveawayId)
    );

    const state = await stub.getState.query();

    if (!state) {
      return ctx.editOriginal('That giveaway does not exist or has already expired.');
    }

    // Update giveaway state to closed and trigger winner selection
    await stub.startAlarm.mutate(1);

    return ctx.editOriginal('Giveaway stopped successfully! Drawing winners...');
  }
}
