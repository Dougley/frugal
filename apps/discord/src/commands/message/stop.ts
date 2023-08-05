import { ApplicationCommandType, CommandContext, SlashCommand, SlashCreator } from 'slash-create';
import { server } from '../../shim';

export default class BotCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      type: ApplicationCommandType.MESSAGE,
      name: 'End Giveaway'
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
    if ((await state.ended) === true) {
      return ctx.send("That giveaway has already ended, so you can't stop it again.", {
        ephemeral: true
      });
    }
    await state.forceTrigger(); // alarms in the past immediately fire
    return ctx.send('Giveaway stopped!', {
      ephemeral: true
    });
  }
}
