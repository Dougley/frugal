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
    const id = await server.env!.KV.get(ctx.targetMessage!.id);
    if (!id)
      return ctx.send('That message is not a giveaway, or it has expired.', {
        ephemeral: true
      });
    const state = server.states!.get(server.env!.GIVEAWAY_STATE.idFromString(id));

    if ((await state.class.getRunning()) === false) {
      return ctx.send("That giveaway has already ended, so you can't stop it again.", {
        ephemeral: true
      });
    }
    await state.class.setAlarm('0'); // alarms in the past immediately fire
    return ctx.send('Giveaway stopped!', {
      ephemeral: true
    });
  }
}
