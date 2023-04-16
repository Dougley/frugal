import { CommandContext, SlashCommand, SlashCreator } from 'slash-create';

export default class BotCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'ping',
      description: 'Pong!'
    });
  }

  async run(ctx: CommandContext) {
    return `Pong!`;
  }
}
