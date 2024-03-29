import { AutocompleteContext, CommandContext, CommandOptionType, SlashCommand, SlashCreator } from 'slash-create';
import { server } from '../../shim';

export default class BotCommand extends SlashCommand {
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
    const id = await server.env!.KV.get(ctx.options.id);
    if (!id)
      return ctx.send('That message is not a giveaway, or it has expired.', {
        ephemeral: true
      });
    const state = server.states!.get(server.env!.GIVEAWAY_STATE.idFromString(id));

    const data = await server
      .db!.selectFrom('giveaways')
      .select(['prize', 'winners', 'description'])
      .where('durable_object_id', '=', id)
      .executeTakeFirst();

    if (!data)
      return ctx.send('That message is not a giveaway, or it has expired.', {
        ephemeral: true
      });

    if ((await state.class.getRunning()) === true) {
      return ctx.send("That giveaway is still running, so you can't reroll it right now. Try stopping it first.", {
        ephemeral: true
      });
    }

    const newWinners = await state.class.drawWinners(1);
    // const message = await state.class.getFormattedEntries(newWinners);
    if (newWinners.length === 0) {
      return ctx.send('No new winners could be drawn, as there were no (other) entries.', {
        ephemeral: true
      });
    }
    await ctx.send(`A new winner has been drawn! The new winner is <@${newWinners[0].id}>, congrats!`, {
      allowedMentions: {
        everyone: false,
        users: [newWinners[0].id]
      }
    });
  }
}
