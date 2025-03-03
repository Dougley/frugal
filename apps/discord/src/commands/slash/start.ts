import {
  ActionRowBuilder,
  ButtonStyle,
  EmbedBuilder,
  LinkButtonBuilder,
  MessageBuilder,
  SlashCommandBuilder,
  SlashCommandIntegerOption,
  SlashCommandStringOption
} from '@discord-interactions/builders';
import { ISlashCommand, SlashCommandContext } from '@discord-interactions/core';
import { EnvContext } from '../../env';

const parseTime = (duration: string): number => {
  const units: { [key: string]: number } = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 0;

  const [, value, unit] = match;
  return parseInt(value, 10) * units[unit];
};

export class StartSlashCommand implements ISlashCommand {
  public builder = new SlashCommandBuilder('start')
    .setDescription('Start a giveaway in the current channel')
    .addStringOption(
      new SlashCommandStringOption('duration', 'Duration of the giveaway (e.g., 30s, 5m, 2h, 1d)').setRequired(true)
    )
    .addIntegerOption(
      new SlashCommandIntegerOption('winners', 'Number of winners').setRequired(true).setMinValue(1).setMaxValue(50)
    )
    .addStringOption(
      new SlashCommandStringOption('prize', 'Prize to win').setRequired(true).setMinLength(1).setMaxLength(100)
    )
    .addStringOption(
      new SlashCommandStringOption('description', 'Description of the giveaway')
        .setRequired(false)
        .setMinLength(1)
        .setMaxLength(1000)
    );

  public handler = async (ctx: SlashCommandContext): Promise<void> => {
    try {
      await ctx.defer();

      if (!EnvContext.env?.GIVEAWAY_STATE || !EnvContext.state) {
        await ctx.edit(new MessageBuilder().setContent('Giveaway state not available'));
        return;
      }

      const duration = parseTime(ctx.getStringOption('duration').value);
      if (duration === 0) {
        await ctx.edit(new MessageBuilder().setContent('Invalid duration format. Use format like: 30s, 5m, 2h, 1d'));
        return;
      }

      // Validate duration limits
      if (duration > 14 * 24 * 60 * 60 * 1000) {
        await ctx.edit(new MessageBuilder().setContent("Giveaways can't be longer than 14 days"));
        return;
      }
      if (duration < 10 * 1000) {
        await ctx.edit(new MessageBuilder().setContent("Giveaways can't be shorter than 10 seconds"));
        return;
      }

      const endTime = new Date(Date.now() + duration);
      const winnersCount = ctx.getIntegerOption('winners').value;
      const prize = ctx.getStringOption('prize').value;
      const description = ctx.hasOption('description') ? ctx.getStringOption('description').value : '';

      const timestamp = Math.floor(endTime.getTime() / 1000);
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle(prize)
        .setDescription(description)
        .addFields(
          {
            name: 'Winners',
            value: winnersCount.toString(),
            inline: true
          },
          {
            name: 'Ends',
            value: `<t:${timestamp}:R> (<t:${timestamp}:F>)`,
            inline: true
          }
        )
        .setTimestamp(endTime);

      // Send the giveaway message to the channel
      const giveawayMessage = await ctx.send(
        new MessageBuilder().setContent('🎉 **GIVEAWAY** 🎉').addEmbeds(embed).setEphemeral(false)
      );

      const id = EnvContext.env.GIVEAWAY_STATE.newUniqueId();
      const stub = EnvContext.state.getInstance(EnvContext.env.GIVEAWAY_STATE, id);

      // Begin the giveaway with the new message ID
      await stub.beginGiveaway.mutate({
        message_id: giveawayMessage.id,
        channel_id: ctx.channelId ?? '0',
        guild_id: ctx.guildId ?? '0',
        prize: prize,
        winners: winnersCount,
        end_time: endTime.toISOString(),
        host_id: ctx.user.id
      });

      // Set up the alarm
      await stub.startAlarm.mutate(endTime.toISOString());

      // Send ephemeral confirmation
      await ctx.send(
        new MessageBuilder()
          .setContent(`✅ Giveaway started successfully!`)
          .addComponents(
            new ActionRowBuilder().addComponents(
              new LinkButtonBuilder()
                .setLabel('View')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://discord.com/channels/${ctx.guildId}/${ctx.channelId}/${giveawayMessage.id}`)
            )
          )
          .setEphemeral(true)
      );
    } catch (error) {
      console.error('Error in start command:', error);
      await ctx.edit(
        new MessageBuilder().setContent(
          `Failed to start giveaway: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  };
}
