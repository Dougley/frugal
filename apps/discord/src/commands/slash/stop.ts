import { AutocompleteContext, CommandContext, CommandOptionType, SlashCommand, SlashCreator } from 'slash-create';
import { server } from '../../shim';

export default class BotCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'stop',
      description: 'Stop a giveaway',
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
    const id = ctx.options.id;
    const giveaway = await server
      .db!.selectFrom('giveaways')
      .select(['prize', 'message_id'])
      .where('guild_id', '=', ctx.guildID!)
      .where('end_time', '>', new Date().toISOString())
      .where('message_id', 'like', `${id}%`)
      .orderBy('end_time', 'asc')
      .limit(10)
      .execute();
    console.log(giveaway);
    if (giveaway.length === 0) return ctx.sendResults([]);
    return ctx.sendResults(
      giveaway.map((giveaway) => ({
        name: `${giveaway.prize}`,
        value: `${giveaway.message_id}`
      }))
    );
  }

  async run(ctx: CommandContext) {
    console.log(ctx.options);
    const data = await server
      .db!.selectFrom('giveaways')
      .selectAll()
      .where('guild_id', '=', ctx.guildID!)
      .where('end_time', '>', new Date().toISOString())
      .where('message_id', '=', ctx.options.id)
      .executeTakeFirst();

    if (!data)
      return ctx.send('That message is not a giveaway, or it has expired.', {
        ephemeral: true
      });

    const state = server.states!.get(server.env!.GIVEAWAY_STATE.idFromString(data.durable_object_id));
    if ((await state.ended) === true) {
      return ctx.send("That giveaway has already ended, so you can't stop it again.", {
        ephemeral: true
      });
    }
    await state.forceTrigger();
    return ctx.send('Giveaway stopped!', {
      ephemeral: true
    });
  }
}
