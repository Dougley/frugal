import { JoinButton } from '@dougley/frugal-utils';
import { CommandContext, CommandOptionType, SlashCreator } from 'slash-create/web';
import { BaseCommand } from '../../classes/BaseCommand';
import { EnvContext } from '../../env';

export default class SaveTestCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'savetest',
      description: 'Test the savestate system',
      options: [
        {
          type: CommandOptionType.STRING,
          name: 'type',
          description: 'Type of test to run',
          required: true,
          choices: [
            { name: 'Full Test', value: 'full' },
            { name: 'Alarm Only', value: 'alarm' },
            { name: 'Get Info', value: 'info' }
          ]
        },
        {
          type: CommandOptionType.STRING,
          name: 'duration',
          description: 'The duration of the test alarm (in seconds)',
          required: false
        },
        {
          type: CommandOptionType.INTEGER,
          name: 'winners',
          description: 'Number of winners to draw',
          required: false,
          min_value: 1
        },
        {
          type: CommandOptionType.STRING,
          name: 'id',
          description: 'The Durable Object ID of the giveaway',
          required: false
        }
      ]
    });
  }

  async run(ctx: CommandContext) {
    await ctx.defer();

    if (!EnvContext.env?.GIVEAWAY_STATE || !EnvContext.state) {
      const errorMessage = await EnvContext.i18n!.translate('common.errors.giveaway_state_unavailable', {
        language: ctx.locale
      });
      return ctx.editOriginal(errorMessage!);
    }

    const testType = ctx.options.type ?? 'full';

    switch (testType) {
      case 'full':
        return this.handleFullTest(ctx);
      case 'alarm':
        return this.handleAlarmTest(ctx);
      case 'info':
        return this.handleInfoTest(ctx);
      default: {
        const errorMessage = await EnvContext.i18n!.translate('commands.savetest.errors.unknown_test_type', {
          language: ctx.locale
        });
        return ctx.editOriginal(errorMessage!);
      }
    }
  }

  private async handleFullTest(ctx: CommandContext) {
    await ctx.defer();

    const id = EnvContext.env!.GIVEAWAY_STATE.newUniqueId();
    const stub = EnvContext.state!.getInstance(EnvContext.env!.GIVEAWAY_STATE, id);
    const durationSeconds = parseInt(ctx.options.duration ?? '60', 10);
    const duration = durationSeconds * 1000;
    const endTime = new Date(Date.now() + duration);
    const winnersCount = ctx.options.winners ?? 1;

    const message = (await ctx.send('Starting full test...')) as unknown as Message;

    // Step 1: Begin the giveaway
    const giveawayResult = await stub.beginGiveaway.mutate({
      message_id: message.id,
      channel_id: ctx.channelID ?? '0',
      guild_id: ctx.guildID ?? '0',
      prize: 'Test Giveaway Prize',
      winners: winnersCount,
      end_time: endTime.toISOString(),
      host_id: ctx.user.id
    });

    // Step 2: Start the alarm
    const alarmResult = await stub.startAlarm.mutate(endTime.toISOString());

    console.trace(giveawayResult, alarmResult);

    // Step 3: Add some test entries (10 fake users)
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
      },
      {
        user_id: '423456789012345678',
        username: 'TestUser4',
        discriminator: '0004',
        avatar: null
      },
      {
        user_id: '523456789012345678',
        username: 'TestUser5',
        discriminator: '0005',
        avatar: null
      },
      {
        user_id: '623456789012345678',
        username: 'TestUser6',
        discriminator: '0006',
        avatar: null
      },
      {
        user_id: '723456789012345678',
        username: 'TestUser7',
        discriminator: '0007',
        avatar: null
      },
      {
        user_id: '823456789012345678',
        username: 'TestUser8',
        discriminator: '0008',
        avatar: null
      },
      {
        user_id: '923456789012345678',
        username: 'TestUser9',
        discriminator: '0009',
        avatar: null
      },
      {
        user_id: '023456789012345678',
        username: 'TestUser10',
        discriminator: '0010',
        avatar: null
      }
    ];

    // Add the command user as an entry too
    const commandUser = {
      user_id: ctx.user.id,
      username: ctx.user.username,
      discriminator: ctx.user.discriminator,
      // Fix: Convert undefined to null to satisfy the type requirements
      avatar: ctx.user.avatar || null
    };

    // Add all test entries
    for (const user of [...testUsers, commandUser]) {
      await stub.addEntry.mutate(user);
    }

    // Fetch current state
    const state = await stub.getState.query();
    const entries = await stub.getEntries.query();

    return ctx.editOriginal({
      content:
        `**Full Giveaway Test Started**\n` +
        `🎁 **Prize:** Test Giveaway Prize\n` +
        `👥 **Winners:** ${winnersCount}\n` +
        `⏱️ **Duration:** ${durationSeconds} seconds\n` +
        `👤 **Entries:** ${entries.length}\n` +
        `📌 **Status:** ${state.state}\n` +
        `🆔 **Object ID:** ${id.toString()}\n\n` +
        `Alarm will trigger at ${endTime.toLocaleString()}`,
      components: [JoinButton.createActionRow(id.toString())]
    });
  }

  private async handleAlarmTest(ctx: CommandContext) {
    const id = EnvContext.env!.GIVEAWAY_STATE.newUniqueId();
    const stub = EnvContext.state!.getInstance(EnvContext.env!.GIVEAWAY_STATE, id);
    const duration = parseInt(ctx.options.duration ?? '60', 10) * 1000;
    const endTime = new Date(Date.now() + duration);

    const output = await stub.startAlarm.mutate(endTime.toISOString());
    console.log(`Test alarm started successfully with Object ID: ${id}`, output);

    return ctx.editOriginal(
      `Started a test alarm that will fire in ${duration / 1000} seconds! (Object ID: ${id.toString()})`
    );
  }

  private async handleInfoTest(ctx: CommandContext) {
    const objectIdStr = ctx.options.id;

    if (!objectIdStr) {
      const errorMessage = await EnvContext.i18n!.translate('commands.savetest.errors.missing_object_id', {
        language: ctx.locale
      });
      return ctx.editOriginal(errorMessage!);
    }

    const stub = EnvContext.state!.getInstance(
      EnvContext.env!.GIVEAWAY_STATE,
      EnvContext.env!.GIVEAWAY_STATE.idFromString(objectIdStr)
    );

    const state = await stub.getState.query();
    const entries = await stub.getEntries.query();

    const endTime = new Date(state.endTime);
    const now = new Date();
    const remaining = Math.max(0, endTime.getTime() - now.getTime());
    const remainingMinutes = Math.floor(remaining / 60000);
    const remainingSeconds = Math.floor((remaining % 60000) / 1000);

    return ctx.editOriginal(
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
    );
  }
}
