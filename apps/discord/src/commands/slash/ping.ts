import { Schema } from '@dougley/frugal-drizzle/workers';
import { CommandContext, SlashCommand, SlashCreator } from 'slash-create/web';
import { EnvContext } from '../../env';

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
    const msg = await ctx.send('🏓 Pinging...');

    // Calculate time difference
    let rtt = 0;
    // Ensure msg is a Message object before accessing timestamp
    if (typeof msg === 'object' && msg !== null && 'timestamp' in msg && typeof msg.timestamp === 'number') {
      rtt = msg.timestamp - ctx.invokedAt;
    } else {
      // Fallback or error handling if msg is not the expected type
      console.error('Failed to get message object for RTT calculation or timestamp is not a number.');
      return ctx.editOriginal('🏓 Pong! Could not calculate RTT.');
    }
    console.log(Schema, Schema.entries);
    console.log(await EnvContext.drizzle!.select().from(Schema.entries).limit(1));

    // Edit the message with the ping information
    return ctx.editOriginal(`🏓 Pong! RTT is \`${rtt}\`ms`);
  }
}
