import {
  MessageBuilder,
  SlashCommandBuilder,
  SlashCommandIntegerOption,
  SlashCommandStringOption
} from '@discord-interactions/builders';
import { ISlashCommand, SlashCommandContext } from '@discord-interactions/core';
import { EnvContext } from '../../env';

export class SaveTestSlashCommand implements ISlashCommand {
  public builder = new SlashCommandBuilder('savetest')
    .setDescription('Test the savestate system')
    .addStringOption(
      new SlashCommandStringOption('type', 'Type of test to run')
        .setRequired(true)
        .addChoices(
          { name: 'Full Test', value: 'full' },
          { name: 'Alarm Only', value: 'alarm' },
          { name: 'Get Info', value: 'info' }
        )
    )
    .addStringOption(
      new SlashCommandStringOption('duration', 'The duration of the test alarm (in seconds)').setRequired(false)
    )

    .addIntegerOption(
      new SlashCommandIntegerOption('winners', 'Number of winners to draw').setRequired(false).setMinValue(1)
    )
    .addStringOption(new SlashCommandStringOption('id', 'The Durable Object ID of the giveaway').setRequired(false));

  public handler = async (ctx: SlashCommandContext): Promise<void> => {
    await ctx.defer();

    if (!EnvContext.env?.GIVEAWAY_STATE || !EnvContext.state) {
      await ctx.edit(new MessageBuilder().setContent('Giveaway state not available'));
      return;
    }

    const testType = ctx.getStringOption('type').value ?? 'full';

    switch (testType) {
      case 'full':
        await this.handleFullTest(ctx);
        break;
      case 'alarm':
        await this.handleAlarmTest(ctx);
        break;
      case 'info':
        await this.handleInfoTest(ctx);
        break;
      default:
        await ctx.edit(new MessageBuilder().setContent('Unknown test type'));
        break;
    }
  };

  private async handleFullTest(ctx: SlashCommandContext): Promise<void> {
    const id = EnvContext.env!.GIVEAWAY_STATE.newUniqueId();
    const stub = EnvContext.state!.getInstance(EnvContext.env!.GIVEAWAY_STATE, id);

    const durationSeconds = parseInt(ctx.getStringOption('duration').value ?? '60', 10);
    const duration = durationSeconds * 1000;
    const endTime = new Date(Date.now() + duration);

    const winnersCount = ctx.getIntegerOption('winners')?.value ?? 1;

    try {
      // Step 1: Begin the giveaway
      const giveawayResult = await stub.beginGiveaway.mutate({
        message_id: ctx.interactionId,
        channel_id: ctx.channelId ?? '0',
        guild_id: ctx.guildId ?? '0',
        prize: 'Test Giveaway Prize',
        winners: winnersCount,
        end_time: endTime.toISOString(),
        host_id: ctx.user.id
      });

      // Step 2: Start the alarm
      const alarmResult = await stub.startAlarm.mutate(endTime.toISOString());

      // Step 3: Add some test entries (3 fake users)
      const testUsers = [
        {
          user_id: '123456789012345678',
          username: 'TestUser1',
          discriminator: '0001',
          avatar: null
        },
        {
          user_id: '223456789012345678',
          username: 'TestUser2',
          discriminator: '0002',
          avatar: null
        },
        {
          user_id: '323456789012345678',
          username: 'TestUser3',
          discriminator: '0003',
          avatar: null
        }
      ];

      // Add the command user as an entry too
      const commandUser = {
        user_id: ctx.user.id,
        username: ctx.user.username,
        discriminator: ctx.user.discriminator,
        avatar: ctx.user.avatar
      };

      // Add all test entries
      for (const user of [...testUsers, commandUser]) {
        try {
          await stub.addEntry.mutate(user);
        } catch (error) {
          console.error(`Failed to add entry for ${user.username}:`, error);
          // Continue with other users
        }
      }

      // Fetch current state
      const state = await stub.getState.query();
      const entries = await stub.getEntries.query();

      await ctx.edit(
        new MessageBuilder().setContent(
          `**Full Giveaway Test Started**\n` +
            `🎁 **Prize:** Test Giveaway Prize\n` +
            `👥 **Winners:** ${winnersCount}\n` +
            `⏱️ **Duration:** ${durationSeconds} seconds\n` +
            `👤 **Entries:** ${entries.length}\n` +
            `📌 **Status:** ${state.state}\n` +
            `🆔 **Object ID:** ${id.toString()}\n\n` +
            `Alarm will trigger at ${endTime.toLocaleString()}`
        )
      );
    } catch (error) {
      console.error('Error in full test:', error);
      await ctx.edit(
        new MessageBuilder().setContent(
          `Failed to run full test: ${error instanceof Error ? error.message : String(error)}\n` +
            `Object ID: ${id.toString()}`
        )
      );
    }
  }

  private async handleAlarmTest(ctx: SlashCommandContext): Promise<void> {
    const id = EnvContext.env!.GIVEAWAY_STATE.newUniqueId();
    const stub = EnvContext.state!.getInstance(EnvContext.env!.GIVEAWAY_STATE, id);

    const duration = parseInt(ctx.getStringOption('duration').value ?? '60', 10) * 1000;
    const endTime = new Date(Date.now() + duration);

    try {
      const output = await stub.startAlarm.mutate(endTime.toISOString());

      console.log(`Test alarm started successfully with Object ID: ${id}`, output);

      await ctx.edit(
        new MessageBuilder().setContent(
          `Started a test alarm that will fire in ${duration / 1000} seconds! (Object ID: ${id.toString()})`
        )
      );
    } catch (error) {
      console.error('Error in alarm test:', error);
      await ctx.edit(
        new MessageBuilder().setContent(
          `Failed to start alarm: ${error instanceof Error ? error.message : String(error)}\n` +
            `Object ID: ${id.toString()}`
        )
      );
    }
  }

  private async handleInfoTest(ctx: SlashCommandContext): Promise<void> {
    const objectIdStr = ctx.getStringOption('id')?.value;
    if (!objectIdStr) {
      await ctx.edit(new MessageBuilder().setContent('Missing object ID'));
      return;
    }

    try {
      const stub = EnvContext.state!.getInstance(
        EnvContext.env!.GIVEAWAY_STATE,
        EnvContext.env!.GIVEAWAY_STATE.idFromString(objectIdStr)
      );

      const state = await stub.getState.query();
      const entries = await stub.getEntries.query();

      const endTime = new Date(state.end_time);
      const now = new Date();
      const remaining = Math.max(0, endTime.getTime() - now.getTime());
      const remainingMinutes = Math.floor(remaining / 60000);
      const remainingSeconds = Math.floor((remaining % 60000) / 1000);

      await ctx.edit(
        new MessageBuilder().setContent(
          `**Giveaway Information**\n` +
            `🎁 **Prize:** ${state.prize}\n` +
            `👥 **Winners:** ${state.winners}\n` +
            `👤 **Entries:** ${entries.length}\n` +
            `📌 **Status:** ${state.state}\n` +
            `⏱️ **End Time:** ${endTime.toLocaleString()}\n` +
            `⌛ **Remaining:** ${remainingMinutes}m ${remainingSeconds}s\n` +
            `🆔 **Object ID:** ${objectIdStr}\n\n` +
            `${
              entries.length > 0
                ? '**Entries:**\n' +
                  entries
                    .slice(0, 5)
                    .map((e) => `- ${e.username}#${e.discriminator}`)
                    .join('\n')
                : 'No entries yet.'
            }` +
            `${entries.length > 5 ? `\n...and ${entries.length - 5} more` : ''}`
        )
      );
    } catch (error) {
      console.error('Error in info test:', error);
      await ctx.edit(
        new MessageBuilder().setContent(
          `Failed to get giveaway info: ${error instanceof Error ? error.message : String(error)}\n` +
            `Object ID: ${objectIdStr}`
        )
      );
    }
  }
}
