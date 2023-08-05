import { ApplicationCommandType, CommandContext, SlashCommand, SlashCreator } from 'slash-create';
import { server } from '../../shim';

export default class BotCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      type: ApplicationCommandType.MESSAGE,
      name: 'Reroll Giveaway'
    });
  }

  async run(ctx: CommandContext) {
    const id = ctx.targetMessage!.id;
    const data = await server
      .db!.selectFrom('giveaways')
      .selectAll()
      .where('guild_id', '=', ctx.guildID!)
      .where('end_time', '>', new Date().toISOString())
      .where('message_id', '=', id)
      .executeTakeFirst();
    if (!data)
      return ctx.send('That message is not a giveaway, or it has expired.', {
        ephemeral: true
      });

    const state = server.states!.get(server.env!.GIVEAWAY_STATE.idFromString(data.durable_object_id));
    if (!(await state.ended)) {
      return ctx.send("That giveaway is still running, so you can't reroll it right now. Try stopping it first.", {
        ephemeral: true
      });
    }

    const newWinners = await state.drawWinners(1);
    if (newWinners.length === 0) {
      return ctx.send('No new winners could be drawn, as there were no (other) entries.', {
        ephemeral: true
      });
    }
    await ctx.send(`A new winner has been drawn! The new winner is <@${newWinners[0].user_id}>, congrats!`, {
      allowedMentions: {
        everyone: false,
        users: [newWinners[0].user_id]
      }
    });
  }
}
