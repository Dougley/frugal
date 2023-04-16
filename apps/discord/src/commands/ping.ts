import { SlashCommand, CommandOptionType, SlashCreator, CommandContext, MessageOptions } from 'slash-create';

export default class BotCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'ping',
      description: 'Pong!'
    });
  }

  async run(ctx: CommandContext) {
    return `Pong! Took ${Date.now() - ctx.invokedAt}ms.`;
  }
}
