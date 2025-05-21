import { CommandContext, SlashCommand, SlashCreator } from 'slash-create/web';

export default class PingCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'ping',
      description: "Test the bot's latency"
    });
  }

  async run(ctx: CommandContext) {
    await ctx.defer();

    // Send initial message
    const startTime = Date.now();
    const msg = await ctx.send('🏓 Pinging...');

    // Calculate time difference
    const endTime = Date.now();
    const rtt = endTime - startTime;

    // Edit the message with the ping information
    return ctx.editOriginal(`🏓 Pong! RTT is \`${rtt}\`ms`);
  }
}
