import { MessageBuilder, SlashCommandBuilder } from '@discord-interactions/builders';
import { ISlashCommand, SlashCommandContext } from '@discord-interactions/core';

export class PingSlashCommand implements ISlashCommand {
  public builder = new SlashCommandBuilder('ping', "Test the bot's latency");

  public handler = async (ctx: SlashCommandContext): Promise<void> => {
    await ctx.defer();
    const msg = await ctx.send(new MessageBuilder().setContent('🏓 Pinging...'));
    const sigOffset = Date.now() - ctx.signedAt.getTime();
    const rtt = new Date(msg.timestamp).getTime() - ctx.receivedAt.getTime();
    await ctx.edit(
      new MessageBuilder().setContent(`🏓 Pong! Signature offset is \`${sigOffset}\`ms, RTT is \`${rtt}\`ms`)
    );
  };
}
