import { CommandContext, SlashCreator } from 'slash-create/web';
import { BaseCommand } from '../../classes/BaseCommand';
import { EnvContext } from '../../env';

export default class PingCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'ping',
      description: "Test the bot's latency"
    });
  }

  async run(ctx: CommandContext) {
    await ctx.defer();

    // Send initial message
    const pingingMessage = await EnvContext.i18n!.translate('commands.ping.messages.pinging', { language: ctx.locale });
    const msg = await ctx.send(pingingMessage!);

    // Calculate time difference
    let rtt = 0;
    // Ensure msg is a Message object before accessing timestamp
    if (typeof msg === 'object' && msg !== null && 'timestamp' in msg && typeof msg.timestamp === 'number') {
      rtt = msg.timestamp - ctx.invokedAt;
    } else {
      // Fallback or error handling if msg is not the expected type
      console.error('Failed to get message object for RTT calculation or timestamp is not a number.');
      const errorMessage = await EnvContext.i18n!.translate('commands.ping.messages.error', { language: ctx.locale });
      return ctx.editOriginal(errorMessage!);
    }

    // Edit the message with the ping information
    const successMessage = await EnvContext.i18n!.translate('commands.ping.messages.success', {
      language: ctx.locale,
      params: { rtt: rtt.toString() }
    });
    return ctx.editOriginal(successMessage!);
  }
}
